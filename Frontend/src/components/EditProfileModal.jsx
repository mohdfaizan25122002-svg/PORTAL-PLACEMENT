import React, { useState } from "react";

export default function EditProfileModal({ isOpen, onClose, student, onSave }) {
  const [name, setName] = useState(student?.name || "");
  const [batch, setBatch] = useState(student?.batch || "Batch 2025-A");
  const [targetRole, setTargetRole] = useState(student?.targetRole || "Full Stack Engineer");
  const [description, setDescription] = useState(student?.description || "");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave({ name, batch, targetRole, description });
    setLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>⚡ Edit Student Profile</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.4rem", cursor: "pointer" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Batch</label>
              <input
                type="text"
                className="form-input"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Career Role</label>
              <input
                type="text"
                className="form-input"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Career Description & Bio</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe your goals, experience, and key technical skills..."
            />
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Saving to DB..." : "💾 Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
