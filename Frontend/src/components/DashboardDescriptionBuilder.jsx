import React, { useState } from "react";

const PRESET_PROMPTS = [
  {
    title: "🚀 Full-Stack AI Engineer",
    role: "Full Stack AI Engineer",
    desc: "Targeting roles building AI-powered web applications with React, Node.js, Python, GraphQL, and System Design.",
  },
  {
    title: "☁️ Cloud & DevOps Architect",
    role: "Cloud DevOps Engineer",
    desc: "Focusing on Kubernetes, Docker containerization, AWS, Microservices, and Infrastructure as Code.",
  },
  {
    title: "📊 Data Scientist & ML Lead",
    role: "Data Scientist",
    desc: "Specializing in Python, PyTorch, SQL database optimization, Data Structures, and predictive analytics.",
  },
  {
    title: "📱 Mobile App Developer",
    role: "Mobile App Engineer",
    desc: "Building high performance mobile applications with React Native, TypeScript, REST APIs, and state management.",
  },
];

export default function DashboardDescriptionBuilder({ currentDescription, currentRole, onGenerate, loading }) {
  const [description, setDescription] = useState(currentDescription || "");
  const [targetRole, setTargetRole] = useState(currentRole || "Full Stack Engineer");

  const handlePresetSelect = (preset) => {
    setDescription(preset.desc);
    setTargetRole(preset.role);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim()) return;
    onGenerate(description, targetRole);
  };

  return (
    <div className="glass-panel glass-panel-glowing" style={{ marginBottom: "28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span className="role-badge role-student">AI Dashboard Generator</span>
            <span style={{ fontSize: "0.8rem", color: "var(--accent-emerald)", fontWeight: 700 }}>● Live Description Parser</span>
          </div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
            ✨ Create Custom Dashboard from Description
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Enter your target career bio, skills, or job preferences to generate a personalized readiness index, skill match board, and tailored roadmaps.
          </p>
        </div>
      </div>

      {/* Preset Chips */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, marginBottom: "8px" }}>
          ⚡ Quick Presets (Click to auto-fill):
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {PRESET_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              className="prompt-chip"
              onClick={() => handlePresetSelect(p)}
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid-2" style={{ gap: "16px", marginBottom: "16px" }}>
          <div>
            <label className="form-label">Target Role / Career Goal</label>
            <input
              type="text"
              className="form-input"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Full Stack Engineer, Cloud DevOps Specialist"
              required
            />
          </div>
          <div>
            <label className="form-label">Key Focus & Skill Keywords</label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", height: "46px" }}>
              <span className="skill-tag">React</span>
              <span className="skill-tag">Node.js</span>
              <span className="skill-tag">Python</span>
              <span className="skill-tag">System Design</span>
              <span className="skill-tag">+ Auto-Detect</span>
            </div>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: "16px" }}>
          <label className="form-label">Enter Detailed Description & Career Aspirations</label>
          <textarea
            className="form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Type your background, target skills, experience, or role description here... (e.g. I am passionate about backend engineering, GraphQL, Redis caching, microservices, and distributed architecture. Goal is top tech placement)."
            rows={3}
            required
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            🎯 AI will analyze text & adapt placement metrics in real-time.
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: "12px 28px", fontSize: "0.95rem" }}
          >
            {loading ? "⚡ Analyzing Description & Generating..." : "🚀 Generate & Update Dashboard"}
          </button>
        </div>
      </form>
    </div>
  );
}
