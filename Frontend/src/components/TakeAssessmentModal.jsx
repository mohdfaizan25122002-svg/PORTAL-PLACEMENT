import React, { useState } from "react";

export default function TakeAssessmentModal({ isOpen, onClose, onSubmit }) {
  const [testName, setTestName] = useState("Full Stack & System Architecture Assessment");
  const [score, setScore] = useState(85);
  const [topSkills, setTopSkills] = useState("React.js, Node.js, Python");
  const [skillGaps, setSkillGaps] = useState("System Design, Docker");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      testName,
      score: Number(score),
      topSkills: topSkills.split(",").map((s) => s.trim()).filter(Boolean),
      skillGaps: skillGaps.split(",").map((s) => s.trim()).filter(Boolean),
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>⚡ Take New Mock Assessment</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.4rem", cursor: "pointer" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Assessment Subject / Title</label>
            <input
              type="text"
              className="form-input"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Simulated Test Score (%): {score}%</label>
            <input
              type="range"
              min="50"
              max="100"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              style={{ width: "100%", accentColor: "var(--primary)", height: "8px" }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Demonstrated Strong Skills (Comma separated)</label>
            <input
              type="text"
              className="form-input"
              value={topSkills}
              onChange={(e) => setTopSkills(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Identified Skill Gaps (Comma separated)</label>
            <input
              type="text"
              className="form-input"
              value={skillGaps}
              onChange={(e) => setSkillGaps(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Test & Recalculate Score</button>
          </div>
        </form>
      </div>
    </div>
  );
}
