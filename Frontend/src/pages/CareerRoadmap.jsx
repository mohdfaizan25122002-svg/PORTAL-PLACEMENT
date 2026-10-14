import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";

export default function CareerRoadmap() {
  const { auth, logout } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [simulatedSkills, setSimulatedSkills] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    // Fetch student info
    fetch("http://localhost:5000/api/student/me", {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setStudentData(data);
        if (data.student && data.student.skills) {
          const initialSkills = {};
          data.student.skills.forEach((s) => {
            initialSkills[s.name] = s.proficiency;
          });
          setSimulatedSkills(initialSkills);
        }
      })
      .catch(console.error);

    // Fetch jobs
    fetch("http://localhost:5000/api/jobs", {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setJobs(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [auth]);

  const handleSliderChange = (skillName, val) => {
    setSimulatedSkills((prev) => ({
      ...prev,
      [skillName]: Number(val),
    }));
  };

  const addCustomSkill = (skillName) => {
    if (!skillName || simulatedSkills[skillName] !== undefined) return;
    setSimulatedSkills((prev) => ({
      ...prev,
      [skillName]: 75,
    }));
    addToast(`Added new skill "${skillName}" to active simulator!`, "success");
  };

  const handleSaveSkillsToProfile = async () => {
    setSaving(true);
    const skillsArray = Object.keys(simulatedSkills).map((k) => ({
      name: k,
      proficiency: simulatedSkills[k],
    }));

    try {
      const res = await fetch("http://localhost:5000/api/student/skills", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ skills: skillsArray }),
      });
      if (res.ok) {
        addToast("✨ Skill proficiencies saved to student profile!", "success");
      } else {
        const err = await res.json();
        addToast(err.error || "Failed to save skills", "error");
      }
    } catch (err) {
      addToast("Error saving skills: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Recalculate dynamic readiness score based on simulated skills
  const computeSimulatedReadinessScore = () => {
    if (!studentData || !studentData.assessments) return 0;
    const assessments = studentData.assessments || [];
    const avgAssessmentScore = assessments.length
      ? assessments.reduce((acc, c) => acc + c.score, 0) / assessments.length
      : 75;

    const skillList = Object.keys(simulatedSkills);
    const skillBreadthCount = skillList.length;
    const avgSkillProficiency = skillList.length
      ? skillList.reduce((acc, k) => acc + simulatedSkills[k], 0) / skillList.length
      : 0;

    const score = Math.min(
      Math.round(avgAssessmentScore * 0.4 + avgSkillProficiency * 0.4 + skillBreadthCount * 5),
      100
    );
    return score;
  };

  // Compute % Match for a Job dynamically
  const computeJobMatch = (requiredSkills = []) => {
    if (!requiredSkills.length) return 100;
    let matchCount = 0;
    let totalProficiency = 0;

    requiredSkills.forEach((reqSkill) => {
      const matchKey = Object.keys(simulatedSkills).find(
        (k) => k.toLowerCase().includes(reqSkill.toLowerCase()) || reqSkill.toLowerCase().includes(k.toLowerCase())
      );
      if (matchKey) {
        matchCount++;
        totalProficiency += simulatedSkills[matchKey];
      }
    });

    const matchRatio = matchCount / requiredSkills.length;
    const avgProf = matchCount ? totalProficiency / matchCount : 0;
    return Math.min(Math.round(matchRatio * 70 + avgProf * 0.3), 100);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>⚡ Loading Dynamic Career Simulator & Skill Roadmap...</p>
      </div>
    );
  }

  const simulatedScore = computeSimulatedReadinessScore();
  const baselineScore = studentData?.readinessScore || 0;
  const scoreDiff = simulatedScore - baselineScore;

  const filteredJobs = jobs.filter(
    (j) =>
      j.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.requiredSkills && j.requiredSkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div>
      <Toast toasts={toasts} removeToast={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

      {/* Navigation Bar */}
      <nav className="navbar">
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          <div className="brand-logo">⚡ PlacementIQ</div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Link
              to={auth.role === "admin" || auth.role === "trainer" ? "/admin" : "/student"}
              className="btn btn-secondary btn-sm"
              style={{ textDecoration: "none" }}
            >
              Dashboard
            </Link>
            <Link
              to="/roadmap"
              className="btn btn-primary btn-sm"
              style={{ textDecoration: "none" }}
            >
              Career Roadmap
            </Link>
          </div>
        </div>

        <div className="nav-user">
          <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>{studentData?.student?.name || "Student Portal"}</span>
          <span className="role-badge role-student">Career Roadmap</span>
          <button onClick={logout} className="btn btn-secondary btn-sm">Sign Out</button>
        </div>
      </nav>

      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "1.9rem", fontWeight: 900, marginBottom: "4px", letterSpacing: "-0.02em" }}>
            Dynamic Career & Skill Growth Hub
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Simulate skill upgrades in real-time, view dynamic job match percentages, and save upgrades to your profile.
          </p>
        </div>

        {/* Dynamic Simulator Header Card */}
        <div className="glass-panel glass-panel-glowing" style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
            <div>
              <span className="role-badge role-student" style={{ marginBottom: "8px", display: "inline-block" }}>
                Interactive Skill Simulator
              </span>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 800 }}>Real-Time Placement Score Predictor</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: "4px" }}>
                Adjust the skill proficiency sliders below to see how upgrading your skills dynamically increases your readiness index!
              </p>
            </div>

            <div style={{ textAlign: "right", background: "rgba(15, 23, 42, 0.7)", padding: "18px 28px", borderRadius: "14px", border: "1px solid var(--border-glass)" }}>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                Simulated Readiness Index
              </div>
              <div style={{ fontSize: "3rem", fontWeight: 900, color: "var(--accent-cyan)", lineHeight: 1 }}>
                {simulatedScore} <span style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>/ 100</span>
              </div>
              {scoreDiff !== 0 && (
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: scoreDiff > 0 ? "var(--accent-emerald)" : "var(--accent-rose)", marginTop: "4px" }}>
                  {scoreDiff > 0 ? `+${scoreDiff} points boost! 🚀` : `${scoreDiff} points`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grid: Interactive Skill Controls & Skill Gap Recommendations */}
        <div className="grid-2" style={{ marginBottom: "28px" }}>
          {/* Skill Proficiency Sliders */}
          <div className="glass-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800 }}>Adjust Skill Levels</h3>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => addCustomSkill(prompt("Enter new skill name (e.g. System Design, Docker, AWS):"))}
                  className="btn btn-outline btn-sm"
                >
                  + Add Skill
                </button>
                <button
                  onClick={handleSaveSkillsToProfile}
                  disabled={saving}
                  className="btn btn-primary btn-sm"
                >
                  {saving ? "Saving..." : "💾 Save to Profile"}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {Object.keys(simulatedSkills).map((skillName) => (
                <div key={skillName}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", fontWeight: 600, marginBottom: "6px" }}>
                    <span>{skillName}</span>
                    <span style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>{simulatedSkills[skillName]}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={simulatedSkills[skillName]}
                    onChange={(e) => handleSliderChange(skillName, e.target.value)}
                    style={{
                      width: "100%",
                      accentColor: "var(--primary)",
                      cursor: "pointer",
                      height: "8px",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Action Plan & Skill Gap Milestones */}
          <div className="glass-panel">
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "4px" }}>
              Personalized Learning Milestones
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "16px" }}>
              High-impact learning modules based on your identified assessment gaps
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ padding: "16px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>🏗️ System Architecture & Distributed Systems</span>
                  <span className="role-badge role-trainer">+12 Score Impact</span>
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "10px" }}>
                  Master load balancers, database sharding, caching strategies, and CAP theorem for tier-1 interviews.
                </p>
                <button onClick={() => addCustomSkill("System Design")} className="btn btn-secondary btn-sm">
                  Add to Active Skills
                </button>
              </div>

              <div style={{ padding: "16px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>🐳 Docker Containerization & Microservices</span>
                  <span className="role-badge role-student">+8 Score Impact</span>
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "10px" }}>
                  Learn multi-stage builds, container orchestration, and API gateway routing patterns.
                </p>
                <button onClick={() => addCustomSkill("Docker & Containers")} className="btn btn-secondary btn-sm">
                  Add to Active Skills
                </button>
              </div>

              <div style={{ padding: "16px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>⚡ Redis High-Speed Caching & Query Optimization</span>
                  <span className="role-badge role-student">+6 Score Impact</span>
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "10px" }}>
                  Implement in-memory data caching, query indexing, and pub/sub message queues.
                </p>
                <button onClick={() => addCustomSkill("Redis & Caching")} className="btn btn-secondary btn-sm">
                  Add to Active Skills
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic AI Job Matcher Section */}
        <div className="glass-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>Dynamic AI Job Match Explorer</h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Calculates real-time % Skill Fit against job requirements based on your simulated skill proficiencies
              </p>
            </div>

            <input
              type="text"
              placeholder="🔍 Search company, role, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ maxWidth: "280px", padding: "8px 14px", fontSize: "0.88rem" }}
            />
          </div>

          <div className="grid-2">
            {filteredJobs.map((job) => {
              const matchPct = computeJobMatch(job.requiredSkills);
              const fitClass =
                matchPct >= 85
                  ? "status-offered"
                  : matchPct >= 70
                  ? "status-interviewing"
                  : "status-applied";
              const fitText = matchPct >= 85 ? "High Fit" : matchPct >= 70 ? "Good Fit" : "Moderate Fit";

              return (
                <div
                  key={job._id}
                  style={{
                    padding: "18px",
                    background: "rgba(15, 23, 42, 0.6)",
                    borderRadius: "14px",
                    border: "1px solid var(--border-glass)",
                    display: "flex",
                    flexDirection: "column",
                    justify: "space-between",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 800 }}>{job.company}</h3>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        {job.role} • <span style={{ color: "var(--accent-cyan)" }}>{job.type}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "1.4rem", fontWeight: 900, color: matchPct >= 80 ? "var(--accent-emerald)" : "var(--accent-amber)" }}>
                        {matchPct}%
                      </div>
                      <span className={`status-badge ${fitClass}`}>{fitText}</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Required Skills:
                    </div>
                    <div>
                      {job.requiredSkills?.map((reqSkill, rIdx) => {
                        const hasSkill = Object.keys(simulatedSkills).some(
                          (k) => k.toLowerCase().includes(reqSkill.toLowerCase()) || reqSkill.toLowerCase().includes(k.toLowerCase())
                        );
                        return (
                          <span
                            key={rIdx}
                            className={`skill-tag ${hasSkill ? "" : "gap-tag"}`}
                          >
                            {reqSkill} {hasSkill ? "✓" : "⚠️"}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="progress-bar-bg" style={{ marginTop: "4px" }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${matchPct}%`,
                        background:
                          matchPct >= 85
                            ? "linear-gradient(90deg, #10b981, #34d399)"
                            : matchPct >= 70
                            ? "linear-gradient(90deg, #6366f1, #38bdf8)"
                            : "linear-gradient(90deg, #f59e0b, #fbbf24)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
