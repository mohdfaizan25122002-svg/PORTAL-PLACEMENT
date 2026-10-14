import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DashboardDescriptionBuilder from "../components/DashboardDescriptionBuilder";
import TakeAssessmentModal from "../components/TakeAssessmentModal";
import EditProfileModal from "../components/EditProfileModal";
import Toast from "../components/Toast";

export default function StudentDashboard() {
  const { auth, logout } = useAuth();
  const [data, setData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genLoading, setGenLoading] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchJobQuery, setSearchJobQuery] = useState("");
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [daInsights, setDaInsights] = useState(null);
  const [syncingDA, setSyncingDA] = useState(false);


  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchStudentData = () => {
    fetch("http://localhost:5000/api/student/me", {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load student data");
        return res.json();
      })
      .then((resData) => {
        setData(resData);
        if (resData?.daInsights && resData.daInsights.lastSyncedAt) {
          setDaInsights(resData.daInsights);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const fetchJobs = () => {
    fetch("http://localhost:5000/api/jobs", {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then((res) => res.json())
      .then((resData) => {
        if (Array.isArray(resData)) setJobs(resData);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchStudentData();
    fetchJobs();
  }, [auth]);

  // Save General Profile to Backend
  const handleSaveProfile = async (profilePayload) => {
    try {
      const res = await fetch("http://localhost:5000/api/student/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(profilePayload),
      });
      const resData = await res.json();
      if (res.ok) {
        addToast("💾 Profile saved successfully to MongoDB!", "success");
        fetchStudentData();
      } else {
        addToast(resData.error || "Failed to save profile", "error");
      }
    } catch (err) {
      addToast("Error saving profile: " + err.message, "error");
    }
  };

  // Pull DA Results from Google Sheets → MongoDB → Dashboard
  const handleSyncDAResults = async () => {
    setSyncingDA(true);
    try {
      const res = await fetch("http://localhost:5000/api/sync/pull-da-results", {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const resData = await res.json();
      if (res.ok) {
        addToast(`🔬 ${resData.message}`, "success");
        fetchStudentData();
      } else {
        addToast(resData.error || "Failed to sync DA results", "error");
      }
    } catch (err) {
      addToast("Sync error: " + err.message, "error");
    } finally {
      setSyncingDA(false);
    }
  };

  // Generate Custom Dashboard from Description & Save to Backend
  const handleGenerateDashboard = async (description, targetRole) => {
    setGenLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/student/generate-dashboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ description, targetRole }),
      });
      const resData = await res.json();
      if (res.ok) {
        setData(resData);
        addToast(`✨ Dashboard generated & saved to backend for: "${targetRole}"!`, "success");
        setActiveTab("overview");
      } else {
        addToast(resData.error || "Failed to generate dashboard", "error");
      }
    } catch (err) {
      addToast("Error generating dashboard: " + err.message, "error");
    } finally {
      setGenLoading(false);
    }
  };

  // Submit Mock Assessment & Save to Backend
  const handleTakeAssessmentSubmit = async (assessmentPayload) => {
    try {
      const res = await fetch("http://localhost:5000/api/student/assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(assessmentPayload),
      });
      if (res.ok) {
        addToast("🎉 Diagnostic test saved to database! Scores updated.", "success");
        fetchStudentData();
      } else {
        const err = await res.json();
        addToast(err.error || "Failed to record assessment", "error");
      }
    } catch (err) {
      addToast("Error submitting test: " + err.message, "error");
    }
  };

  // Apply to Job Position & Save to Backend
  const handleApply = async (jobId) => {
    setApplyingJobId(jobId);
    try {
      const res = await fetch("http://localhost:5000/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ jobId }),
      });
      if (res.ok) {
        addToast("🚀 Job application recorded in database!", "success");
        fetchStudentData();
      } else {
        const errData = await res.json();
        addToast(errData.error || "Failed to apply", "error");
      }
    } catch (err) {
      addToast("Error submitting application: " + err.message, "error");
    } finally {
      setApplyingJobId(null);
    }
  };

  // Compute % Match against Job requirements
  const computeJobMatch = (requiredSkills = []) => {
    if (!data?.student?.skills || !requiredSkills.length) return 100;
    const studentSkills = data.student.skills;
    let matchCount = 0;
    let totalProf = 0;

    requiredSkills.forEach((req) => {
      const found = studentSkills.find(
        (s) => s.name.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(s.name.toLowerCase())
      );
      if (found) {
        matchCount++;
        totalProf += found.proficiency;
      }
    });

    const ratio = matchCount / requiredSkills.length;
    const avgP = matchCount ? totalProf / matchCount : 50;
    return Math.min(Math.round(ratio * 70 + avgP * 0.3), 100);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
        <div style={{ fontSize: "2.5rem" }}>⚡</div>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", fontWeight: 600 }}>
          Computing AI Placement Intelligence & Custom Dashboard...
        </p>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="container">
        <nav className="navbar" style={{ marginBottom: "32px", borderRadius: "14px" }}>
          <div className="brand-logo">⚡ PlacementIQ</div>
          <button onClick={logout} className="btn btn-secondary btn-sm">Logout</button>
        </nav>
        <div className="glass-panel" style={{ textAlign: "center", padding: "48px 24px" }}>
          <h2 style={{ color: "var(--accent-rose)", marginBottom: "12px", fontSize: "1.5rem" }}>Student Profile Not Found</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
            {data?.error || "Your account does not have an active student profile assigned."}
          </p>
          <button onClick={logout} className="btn btn-primary">Return to Login</button>
        </div>
      </div>
    );
  }

  const { student, assessments, applications, readinessScore } = data;
  const appliedJobIds = applications.map((app) => app.jobId?._id || app.jobId);

  const filteredJobsList = jobs.filter(
    (j) =>
      j.company.toLowerCase().includes(searchJobQuery.toLowerCase()) ||
      j.role.toLowerCase().includes(searchJobQuery.toLowerCase()) ||
      (j.requiredSkills && j.requiredSkills.some((s) => s.toLowerCase().includes(searchJobQuery.toLowerCase())))
  );

  return (
    <div>
      {/* Toast Notifications */}
      <Toast toasts={toasts} removeToast={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

      {/* Modals */}
      <TakeAssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        onSubmit={handleTakeAssessmentSubmit}
      />

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        student={student}
        onSave={handleSaveProfile}
      />

      {/* Navigation Header */}
      <nav className="navbar">
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          <div className="brand-logo">⚡ PlacementIQ</div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className={`btn btn-sm ${activeTab === "overview" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("overview")}
            >
              Dashboard
            </button>
            <button
              className={`btn btn-sm ${activeTab === "description" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("description")}
            >
              ✨ Generator
            </button>
            <Link to="/roadmap" className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>
              Career Roadmap
            </Link>
          </div>
        </div>

        <div className="nav-user">
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>{student.name}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{student.targetRole || "Student Candidate"}</div>
          </div>
          <span className="role-badge role-student">{student.batch}</span>
          <button onClick={() => setIsEditProfileOpen(true)} className="btn btn-secondary btn-sm" title="Edit Profile Details">
            ✏️ Profile
          </button>
          <button onClick={logout} className="btn btn-secondary btn-sm">Sign Out</button>
        </div>
      </nav>

      <div className="container">
        {/* Welcome Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "1.9rem", fontWeight: 900, marginBottom: "4px", letterSpacing: "-0.02em" }}>
              Student Placement Dashboard
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Target Role: <span style={{ color: "#38bdf8", fontWeight: 700 }}>{student.targetRole || "Full Stack Engineer"}</span> | Status:{" "}
              <span style={{ color: student.isPlaced ? "var(--accent-emerald)" : "var(--accent-amber)", fontWeight: 700 }}>
                {student.isPlaced ? "Placed 🎉" : "Active Candidate"}
              </span>
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={() => setIsEditProfileOpen(true)} className="btn btn-secondary btn-sm">
              💾 Edit & Save Profile
            </button>
            <button onClick={() => setActiveTab("description")} className="btn btn-primary btn-sm">
              ✨ Description Generator
            </button>
            <button onClick={() => setIsAssessmentModalOpen(true)} className="btn btn-outline btn-sm">
              + Take Diagnostic Test
            </button>
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            📊 Overview & Metrics
          </button>
          <button
            className={`tab-btn ${activeTab === "description" ? "active" : ""}`}
            onClick={() => setActiveTab("description")}
          >
            ✨ AI Description Builder
          </button>
          <button
            className={`tab-btn ${activeTab === "jobs" ? "active" : ""}`}
            onClick={() => setActiveTab("jobs")}
          >
            💼 Job Openings ({jobs.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "assessments" ? "active" : ""}`}
            onClick={() => setActiveTab("assessments")}
          >
            📝 Assessment History ({assessments.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "daInsights" ? "active" : ""}`}
            onClick={() => setActiveTab("daInsights")}
          >
            🔬 DA Insights {daInsights?.lastSyncedAt ? "✅" : ""}
          </button>
        </div>

        {/* TAB 1: OVERVIEW & DASHBOARD METRICS */}
        {activeTab === "overview" && (
          <div>
            {/* Description Banner Summary */}
            {student.description && (
              <div
                className="glass-panel"
                style={{
                  marginBottom: "24px",
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(6, 182, 212, 0.12))",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span className="role-badge role-student" style={{ marginBottom: "6px", display: "inline-block" }}>
                      Active Saved Bio / Career Description
                    </span>
                    <p style={{ fontSize: "0.92rem", fontStyle: "italic", color: "#e2e8f0" }}>
                      "{student.description}"
                    </p>
                  </div>
                  <button onClick={() => setActiveTab("description")} className="btn btn-secondary btn-sm">
                    Update Description
                  </button>
                </div>
              </div>
            )}

            {/* Top Grid: Readiness Meter & Skill Breakdown */}
            <div className="grid-2" style={{ marginBottom: "28px" }}>
              {/* Readiness Score Ring Card */}
              <div className="glass-panel" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span className="role-badge role-student">AI Meter</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--accent-emerald)", fontWeight: 700 }}>Saved to Database</span>
                  </div>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 800 }}>Placement Readiness Index</h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
                    Computed from 60% Mock Assessment Scores + 40% Target Skill Proficiencies
                  </p>
                </div>

                <div style={{ margin: "24px 0", textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "3.8rem",
                      fontWeight: 900,
                      background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      lineHeight: 1,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {readinessScore} <span style={{ fontSize: "1.5rem", color: "var(--text-muted)" }}>/ 100</span>
                  </div>

                  <div className="progress-bar-bg" style={{ marginTop: "18px", height: "14px" }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${readinessScore}%`,
                        background:
                          readinessScore >= 80
                            ? "linear-gradient(90deg, #10b981, #34d399)"
                            : readinessScore >= 60
                            ? "linear-gradient(90deg, #6366f1, #38bdf8)"
                            : "linear-gradient(90deg, #f59e0b, #fbbf24)",
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--text-muted)",
                    background: "rgba(15, 23, 42, 0.6)",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "1px solid var(--border-glass)",
                  }}
                >
                  🎯{" "}
                  {readinessScore >= 80
                    ? "High interview readiness! Excellent alignment with target engineer roles."
                    : "Solid progress. Complete mock assessments and simulate skill upgrades to reach 85+!"}
                </div>
              </div>

              {/* Skill Profile & Proficiency Card */}
              <div className="glass-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 800 }}>Skill Profile & Proficiency</h2>
                  <Link to="/roadmap" style={{ fontSize: "0.8rem", color: "var(--accent-cyan)", textDecoration: "none", fontWeight: 700 }}>
                    Simulate Upgrades ➔
                  </Link>
                </div>

                {student.skills && student.skills.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {student.skills.slice(0, 5).map((skill, idx) => (
                      <div key={idx}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", fontWeight: 600, marginBottom: "6px" }}>
                          <span>{skill.name}</span>
                          <span style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>{skill.proficiency}%</span>
                        </div>
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{ width: `${skill.proficiency}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No skills recorded yet. Use the description generator to auto-detect skills!</p>
                )}
              </div>
            </div>

            {/* Quick Action Row: Applications & Top Job Matches */}
            <div className="grid-2">
              {/* Active Applications */}
              <div className="glass-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 800 }}>Tracked Applications</h2>
                  <span className="role-badge role-student">{applications.length} Active</span>
                </div>

                {applications && applications.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {applications.map((app, idx) => {
                      const job = app.jobId;
                      const statusClass =
                        app.status === "Offered"
                          ? "status-offered"
                          : app.status === "Interviewing"
                          ? "status-interviewing"
                          : app.status === "Rejected"
                          ? "status-rejected"
                          : "status-applied";
                      return (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "14px 16px",
                            background: "rgba(15, 23, 42, 0.6)",
                            borderRadius: "12px",
                            border: "1px solid var(--border-glass)",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{job?.company || "Company"}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{job?.role || "Position"}</div>
                          </div>
                          <span className={`status-badge ${statusClass}`}>{app.status}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No applications submitted yet. Browse jobs to apply!</p>
                )}
              </div>

              {/* Top Job Matches */}
              <div className="glass-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 800 }}>Top Recommended Jobs</h2>
                  <button onClick={() => setActiveTab("jobs")} className="btn btn-secondary btn-sm">
                    View All ({jobs.length})
                  </button>
                </div>

                {jobs && jobs.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {jobs.slice(0, 3).map((job) => {
                      const isApplied = appliedJobIds.includes(job._id);
                      const matchPct = computeJobMatch(job.requiredSkills);
                      return (
                        <div
                          key={job._id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "14px 16px",
                            background: "rgba(15, 23, 42, 0.6)",
                            borderRadius: "12px",
                            border: "1px solid var(--border-glass)",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{job.company}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              {job.role} • <span style={{ color: "var(--accent-cyan)" }}>{matchPct}% Match</span>
                            </div>
                          </div>
                          {isApplied ? (
                            <span className="status-badge status-applied">Applied</span>
                          ) : (
                            <button
                              onClick={() => handleApply(job._id)}
                              disabled={applyingJobId === job._id}
                              className="btn btn-outline btn-sm"
                            >
                              Apply
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No active job listings.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AI DESCRIPTION BUILDER */}
        {activeTab === "description" && (
          <DashboardDescriptionBuilder
            currentDescription={student.description}
            currentRole={student.targetRole}
            onGenerate={handleGenerateDashboard}
            loading={genLoading}
          />
        )}

        {/* TAB 3: JOB OPENINGS & MATCH BOARD */}
        {activeTab === "jobs" && (
          <div className="glass-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>Available Placement Openings</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Real-time % Skill Fit based on your profile & target description
                </p>
              </div>

              <input
                type="text"
                placeholder="🔍 Search company, role, or skill..."
                value={searchJobQuery}
                onChange={(e) => setSearchJobQuery(e.target.value)}
                className="form-input"
                style={{ maxWidth: "300px" }}
              />
            </div>

            <div className="grid-2">
              {filteredJobsList.map((job) => {
                const isApplied = appliedJobIds.includes(job._id);
                const matchPct = computeJobMatch(job.requiredSkills);

                return (
                  <div
                    key={job._id}
                    style={{
                      padding: "20px",
                      background: "rgba(15, 23, 42, 0.6)",
                      borderRadius: "14px",
                      border: "1px solid var(--border-glass)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "14px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 800 }}>{job.company}</h3>
                        <div style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
                          {job.role} • <span style={{ color: "var(--accent-cyan)" }}>{job.type}</span>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "1.5rem", fontWeight: 900, color: matchPct >= 80 ? "var(--accent-emerald)" : "var(--accent-amber)" }}>
                          {matchPct}%
                        </div>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Skill Match
                        </span>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", fontWeight: 700 }}>
                        Required Skills:
                      </div>
                      <div>
                        {job.requiredSkills?.map((reqSkill, rIdx) => (
                          <span key={rIdx} className="skill-tag">{reqSkill}</span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                      <div style={{ flex: 1, marginRight: "16px" }}>
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{ width: `${matchPct}%` }} />
                        </div>
                      </div>
                      {isApplied ? (
                        <span className="status-badge status-applied">Applied</span>
                      ) : (
                        <button
                          onClick={() => handleApply(job._id)}
                          disabled={applyingJobId === job._id}
                          className="btn btn-primary btn-sm"
                        >
                          {applyingJobId === job._id ? "Applying..." : "Apply Now"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: MOCK ASSESSMENTS */}
        {activeTab === "assessments" && (
          <div className="glass-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>Mock Assessment & Diagnostic Intelligence</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Historical mock test performance, identified skill gaps, and strengths saved in MongoDB
                </p>
              </div>
              <button onClick={() => setIsAssessmentModalOpen(true)} className="btn btn-primary btn-sm">
                + Take New Assessment
              </button>
            </div>

            {assessments && assessments.length > 0 ? (
              <div style={{ display: "grid", gap: "16px" }}>
                {assessments.map((test, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "rgba(15, 23, 42, 0.6)",
                      border: "1px solid var(--border-glass)",
                      borderRadius: "14px",
                      padding: "18px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 800 }}>{test.testName}</h3>
                      <span
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: 800,
                          color: test.score >= 80 ? "var(--accent-emerald)" : "var(--accent-amber)",
                          background: test.score >= 80 ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                          padding: "4px 14px",
                          borderRadius: "8px",
                        }}
                      >
                        {test.score}% Score
                      </span>
                    </div>

                    {test.topSkills && test.topSkills.length > 0 && (
                      <div>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginRight: "8px" }}>Strong Areas:</span>
                        {test.topSkills.map((sk, sIdx) => (
                          <span key={sIdx} className="skill-tag" style={{ background: "rgba(16, 185, 129, 0.15)", borderColor: "rgba(16, 185, 129, 0.3)", color: "#6ee7b7" }}>
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}

                    {test.skillGaps && test.skillGaps.length > 0 && (
                      <div>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginRight: "8px" }}>Identified Gaps:</span>
                        {test.skillGaps.map((gap, gIdx) => (
                          <span key={gIdx} className="skill-tag gap-tag">{gap}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No assessments taken yet. Click "+ Take New Assessment" to complete one now!</p>
            )}
          </div>
        )}

        {/* TAB 5: DA INSIGHTS */}
        {activeTab === "daInsights" && (
          <div className="glass-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>🔬 DA Analysis Insights</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Results analysed by DA students from your Google Sheet data
                </p>
              </div>
              <button onClick={handleSyncDAResults} disabled={syncingDA} className="btn btn-primary btn-sm">
                {syncingDA ? "⏳ Syncing..." : "🔄 Sync DA Results"}
              </button>
            </div>

            {daInsights && daInsights.lastSyncedAt ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                {/* Predicted Placement Chance + Readiness Analysis */}
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "180px", padding: "20px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "14px", textAlign: "center" }}>
                    <div style={{ fontSize: "3rem", fontWeight: 900, color: "var(--accent-emerald)" }}>
                      {daInsights.predictedPlacementChance}%
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                      DA Predicted Placement Chance
                    </div>
                    <div className="progress-bar-bg" style={{ marginTop: "12px" }}>
                      <div className="progress-bar-fill" style={{ width: `${daInsights.predictedPlacementChance}%`, background: "linear-gradient(90deg,#10b981,#34d399)" }} />
                    </div>
                  </div>

                  <div style={{ flex: 2, minWidth: "260px", padding: "20px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "14px" }}>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "8px" }}>DA Readiness Analysis</div>
                    <p style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "#e2e8f0" }}>
                      {daInsights.readinessAnalysis || "No analysis text provided yet."}
                    </p>
                  </div>
                </div>

                {/* Courses, Strengths, Improvements */}
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  {daInsights.recommendedCourses?.length > 0 && (
                    <div style={{ flex: 1, minWidth: "200px", padding: "16px", background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.25)", borderRadius: "12px" }}>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "10px" }}>📚 Recommended Courses</div>
                      <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                        {daInsights.recommendedCourses.map((c, i) => (
                          <li key={i} style={{ fontSize: "0.9rem", color: "#38bdf8" }}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {daInsights.keyStrengths?.length > 0 && (
                    <div style={{ flex: 1, minWidth: "200px", padding: "16px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "12px" }}>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "10px" }}>💪 Key Strengths</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {daInsights.keyStrengths.map((s, i) => (
                          <span key={i} className="skill-tag" style={{ background: "rgba(16,185,129,0.15)", borderColor: "rgba(16,185,129,0.3)", color: "#6ee7b7" }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {daInsights.areasToImprove?.length > 0 && (
                    <div style={{ flex: 1, minWidth: "200px", padding: "16px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "12px" }}>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "10px" }}>🎯 Areas to Improve</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {daInsights.areasToImprove.map((a, i) => (
                          <span key={i} className="skill-tag gap-tag">{a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* DA Comment */}
                {daInsights.daComment && (
                  <div style={{ padding: "16px", background: "rgba(15,23,42,0.6)", border: "1px solid var(--border-glass)", borderRadius: "12px" }}>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "8px" }}>💬 DA Comment</div>
                    <p style={{ fontSize: "0.9rem", fontStyle: "italic", color: "#e2e8f0" }}>"{daInsights.daComment}"</p>
                  </div>
                )}

                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "right" }}>
                  Last synced: {new Date(daInsights.lastSyncedAt).toLocaleString("en-IN")}
                </p>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 24px" }}>
                <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🔬</div>
                <h3 style={{ color: "var(--text-muted)", marginBottom: "8px" }}>No DA Results Yet</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "20px" }}>
                  DA students haven't analysed your data yet, or results haven't been synced.
                  <br />Click the button above to check for new results from Google Sheets.
                </p>
                <button onClick={handleSyncDAResults} disabled={syncingDA} className="btn btn-primary">
                  {syncingDA ? "⏳ Syncing..." : "🔄 Check for DA Results"}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
