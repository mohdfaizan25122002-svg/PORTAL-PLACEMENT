import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AddJobModal from "../components/AddJobModal";
import Toast from "../components/Toast";

export default function AdminDashboard() {
  const { auth, logout } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("analytics"); // analytics, cohort, jobs
  const [studentSearch, setStudentSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchAnalytics = () => {
    fetch("http://localhost:5000/api/admin/analytics", {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load analytics");
        return res.json();
      })
      .then(setAnalytics)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const fetchStudents = () => {
    fetch("http://localhost:5000/api/admin/students", {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setStudents(data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchAnalytics();
    fetchStudents();
  }, [auth]);

  const handleAddJobSubmit = async (jobPayload) => {
    try {
      const res = await fetch("http://localhost:5000/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(jobPayload),
      });
      if (res.ok) {
        addToast(`💼 Job listing published: ${jobPayload.company} - ${jobPayload.role}`, "success");
        fetchAnalytics();
      } else {
        const err = await res.json();
        addToast(err.error || "Failed to publish job opening", "error");
      }
    } catch (err) {
      addToast("Error publishing job: " + err.message, "error");
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
        <div style={{ fontSize: "2.5rem" }}>⚡</div>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", fontWeight: 600 }}>
          Loading Placement Analytics & Intelligence Data...
        </p>
      </div>
    );
  }

  if (!analytics || analytics.error) {
    return (
      <div className="container">
        <nav className="navbar" style={{ marginBottom: "32px", borderRadius: "14px" }}>
          <div className="brand-logo">⚡ PlacementIQ</div>
          <button onClick={logout} className="btn btn-secondary btn-sm">Logout</button>
        </nav>
        <div className="glass-panel" style={{ textAlign: "center", padding: "48px 24px" }}>
          <h2 style={{ color: "var(--accent-rose)", marginBottom: "12px", fontSize: "1.5rem" }}>Access Restricted</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
            {analytics?.error || "You do not have administrative privileges to view placement analytics."}
          </p>
          <button onClick={logout} className="btn btn-primary">Return to Login</button>
        </div>
      </div>
    );
  }

  const { kpis, commonSkillGaps, batchPerformance } = analytics;

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.skills && s.skills.some((sk) => sk.name.toLowerCase().includes(studentSearch.toLowerCase()))) ||
      (s.targetRole && s.targetRole.toLowerCase().includes(studentSearch.toLowerCase()));
    const matchesBatch = batchFilter === "all" || s.batch === batchFilter;
    return matchesSearch && matchesBatch;
  });

  return (
    <div>
      <Toast toasts={toasts} removeToast={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

      {/* Add Job Modal */}
      <AddJobModal
        isOpen={isAddJobOpen}
        onClose={() => setIsAddJobOpen(false)}
        onSubmit={handleAddJobSubmit}
      />

      {/* Navigation Header */}
      <nav className="navbar">
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          <div className="brand-logo">⚡ PlacementIQ</div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className={`btn btn-sm ${activeTab === "analytics" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("analytics")}
            >
              Analytics
            </button>
            <button
              className={`btn btn-sm ${activeTab === "cohort" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("cohort")}
            >
              Cohort Students ({students.length})
            </button>
            <Link to="/roadmap" className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>
              Career Simulator
            </Link>
          </div>
        </div>

        <div className="nav-user">
          <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>Placement Admin</span>
          <span className="role-badge role-admin">{auth.role}</span>
          <button onClick={logout} className="btn btn-secondary btn-sm">Sign Out</button>
        </div>
      </nav>

      <div className="container">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "1.9rem", fontWeight: 900, marginBottom: "4px", letterSpacing: "-0.02em" }}>
              Placement Intelligence & Analytics
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Real-time cohort tracking, skill-gap analysis, and placement conversions.
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={() => setIsAddJobOpen(true)} className="btn btn-primary btn-sm">
              + Post New Job Opening
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            📊 Analytics & KPIs
          </button>
          <button
            className={`tab-btn ${activeTab === "cohort" ? "active" : ""}`}
            onClick={() => setActiveTab("cohort")}
          >
            👥 Student Cohort Directory ({students.length})
          </button>
        </div>

        {activeTab === "analytics" && (
          <div>
            {/* 4 Metric KPI Cards */}
            <div className="grid-4" style={{ marginBottom: "28px" }}>
              <div className="kpi-card">
                <div className="kpi-title">Placement Rate</div>
                <div className="kpi-value" style={{ color: "#34d399" }}>{kpis.placementRate}</div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px" }}>
                  Total Placed Candidates
                </p>
              </div>

              <div className="kpi-card">
                <div className="kpi-title">Avg Assessment Score</div>
                <div className="kpi-value" style={{ color: "#38bdf8" }}>{kpis.avgAssessmentScore}%</div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px" }}>
                  Across All Mock Diagnostics
                </p>
              </div>

              <div className="kpi-card">
                <div className="kpi-title">Job Conversion Rate</div>
                <div className="kpi-value" style={{ color: "#a78bfa" }}>{kpis.conversionRate}</div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px" }}>
                  Applications to Offer Ratio
                </p>
              </div>

              <div className="kpi-card">
                <div className="kpi-title">Active Cohort Size</div>
                <div className="kpi-value" style={{ color: "#fbbf24" }}>{kpis.totalStudents}</div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px" }}>
                  Registered Students
                </p>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid-2">
              {/* Skill Gaps Analysis */}
              <div className="glass-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 800 }}>Identified Skill Gaps</h2>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Topics requiring targeted intervention modules</p>
                  </div>
                  <span className="role-badge role-trainer">Action Required</span>
                </div>

                {commonSkillGaps && commonSkillGaps.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {commonSkillGaps.map((item, idx) => {
                      const maxCount = Math.max(...commonSkillGaps.map((g) => g.count), 1);
                      const percentage = Math.round((item.count / maxCount) * 100);
                      return (
                        <div key={idx}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", fontWeight: 600, marginBottom: "6px" }}>
                            <span>⚠️ {item.skill}</span>
                            <span style={{ color: "var(--accent-rose)", fontWeight: 700 }}>
                              {item.count} student{item.count > 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="progress-bar-bg">
                            <div
                              className="progress-bar-fill"
                              style={{
                                width: `${percentage}%`,
                                background: "linear-gradient(90deg, #f43f5e, #fb7185)",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No skill gaps identified yet.</p>
                )}
              </div>

              {/* Batch-wise Performance */}
              <div className="glass-panel">
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "4px" }}>Batch-wise Performance</h2>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "16px" }}>Comparative cohort assessment analytics</p>

                {batchPerformance && batchPerformance.length > 0 ? (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Batch</th>
                        <th>Students</th>
                        <th>Avg Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchPerformance.map((batch, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 700 }}>{batch._id || "Unassigned"}</td>
                          <td>{batch.totalStudents}</td>
                          <td>
                            <span style={{ fontWeight: 700, color: "var(--accent-cyan)" }}>
                              {batch.avgBatchScore ? `${batch.avgBatchScore.toFixed(1)}%` : "N/A"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No batch data available.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "cohort" && (
          <div className="glass-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>Student Cohort Directory</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Search, filter, and review student skill profiles and target career descriptions
                </p>
              </div>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <select
                  className="form-select"
                  value={batchFilter}
                  onChange={(e) => setBatchFilter(e.target.value)}
                  style={{ width: "160px" }}
                >
                  <option value="all">All Batches</option>
                  <option value="Batch 2025-A">Batch 2025-A</option>
                  <option value="Batch 2025-B">Batch 2025-B</option>
                </select>

                <input
                  type="text"
                  placeholder="🔍 Search name or skill..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="form-input"
                  style={{ maxWidth: "240px" }}
                />
              </div>
            </div>

            {filteredStudents.length > 0 ? (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Batch</th>
                    <th>Target Role / Description</th>
                    <th>Recorded Skills</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((st) => (
                    <tr key={st._id}>
                      <td style={{ fontWeight: 700 }}>{st.name}</td>
                      <td><span className="role-badge role-student">{st.batch}</span></td>
                      <td style={{ maxWidth: "280px" }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-cyan)" }}>
                          {st.targetRole || "Full Stack Candidate"}
                        </div>
                        {st.description && (
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            "{st.description}"
                          </div>
                        )}
                      </td>
                      <td>
                        {st.skills && st.skills.length > 0 ? (
                          st.skills.slice(0, 3).map((sk, sIdx) => (
                            <span key={sIdx} className="skill-tag">{sk.name} ({sk.proficiency}%)</span>
                          ))
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>None</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${st.isPlaced ? "status-offered" : "status-applied"}`}>
                          {st.isPlaced ? "Placed 🎉" : "Active"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No matching students found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
