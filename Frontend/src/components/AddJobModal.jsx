import React, { useState } from "react";

export default function AddJobModal({ isOpen, onClose, onSubmit }) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [type, setType] = useState("Job");
  const [descriptionInput, setDescriptionInput] = useState("");

  if (!isOpen) return null;

  const handleParseDescription = () => {
    if (!descriptionInput.trim()) return;
    const text = descriptionInput;
    // Auto extract company, role, skills
    if (text.includes("at ")) {
      const parts = text.split("at ");
      if (parts[1]) setCompany(parts[1].split(" ")[0].replace(/[,.]/g, ""));
    }
    const known = ["React", "Node.js", "Python", "Java", "Docker", "Kubernetes", "AWS", "SQL", "System Design", "TypeScript"];
    const found = known.filter(k => text.toLowerCase().includes(k.toLowerCase()));
    if (found.length) setRequiredSkills(found.join(", "));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!company || !role) return;
    onSubmit({
      company,
      role,
      requiredSkills,
      type,
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>⚡ Post New Job Opening</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.4rem", cursor: "cursor" }}>✕</button>
        </div>

        {/* Description Parser Card inside Modal */}
        <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "14px", borderRadius: "12px", border: "1px solid var(--border-glass)", marginBottom: "18px" }}>
          <label className="form-label" style={{ color: "var(--accent-cyan)" }}>✨ Auto-Fill from Job Description</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              className="form-input"
              style={{ fontSize: "0.85rem" }}
              placeholder="e.g. Senior Frontend Dev at Netflix requiring React, TypeScript..."
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
            />
            <button type="button" onClick={handleParseDescription} className="btn btn-secondary btn-sm">Auto-Detect</button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Apple, Netflix, Uber"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Role / Position Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Senior Systems Architect"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Required Tech Skills (Comma separated)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. React.js, Node.js, GraphQL, Redis"
              value={requiredSkills}
              onChange={(e) => setRequiredSkills(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Opportunity Type</label>
            <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="Job">Full Time Job</option>
              <option value="Internship">Summer Internship</option>

            </select>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Publish Job Listing</button>
          </div>
        </form>
      </div>
    </div>
  );
}
