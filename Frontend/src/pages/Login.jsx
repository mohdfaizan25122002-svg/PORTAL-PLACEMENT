import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("student");
  const [batch, setBatch] = useState("Batch 2025-A");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isRegister
      ? "http://localhost:5000/api/auth/register"
      : "http://localhost:5000/api/auth/login";

    const payload = isRegister
      ? { email, password, role, name: name || email.split("@")[0], batch }
      : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (isRegister) {
        // After registration, auto login
        const loginRes = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) {
          login(loginData.token, loginData.role);
          navigate(
            loginData.role === "admin" || loginData.role === "trainer"
              ? "/admin"
              : "/student"
          );
        } else {
          setIsRegister(false);
          setError("Registration successful! Please sign in.");
        }
      } else {
        login(data.token, data.role);
        navigate(
          data.role === "admin" || data.role === "trainer"
            ? "/admin"
            : "/student"
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setIsRegister(false);
    // Direct submit demo credentials
    setLoading(true);
    fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: demoEmail, password: demoPassword }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.token) {
          login(data.token, data.role);
          navigate(
            data.role === "admin" || data.role === "trainer"
              ? "/admin"
              : "/student"
          );
        } else {
          setError(data.error || "Demo login failed");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div className="glass-panel" style={{ width: "100%", maxWidth: "440px" }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div className="brand-logo" style={{ justifyContent: "center", fontSize: "1.6rem", marginBottom: "8px" }}>
            <span style={{ background: "rgba(99, 102, 241, 0.2)", padding: "6px 12px", borderRadius: "12px", border: "1px solid rgba(99, 102, 241, 0.4)" }}>⚡</span>
            PlacementIQ
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Placement Readiness & Performance Analytics
          </p>
        </div>

        {/* Tab Toggle */}
        <div style={{ display: "flex", background: "rgba(15, 23, 42, 0.6)", borderRadius: "10px", padding: "4px", marginBottom: "24px", border: "1px solid var(--border-glass)" }}>
          <button
            onClick={() => { setIsRegister(false); setError(""); }}
            style={{
              flex: 1,
              padding: "8px",
              border: "none",
              borderRadius: "8px",
              background: !isRegister ? "var(--primary)" : "transparent",
              color: !isRegister ? "#fff" : "var(--text-muted)",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsRegister(true); setError(""); }}
            style={{
              flex: 1,
              padding: "8px",
              border: "none",
              borderRadius: "8px",
              background: isRegister ? "var(--primary)" : "transparent",
              color: isRegister ? "#fff" : "var(--text-muted)",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Register
          </button>
        </div>

        {error && (
          <div style={{ background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)", color: "#fca5a5", padding: "10px 14px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "20px" }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleAuthSubmit}>
          {isRegister && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Alex Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account Role</label>
                <select
                  className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="student">Student</option>
                  <option value="trainer">Trainer / Placement Officer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {role === "student" && (
                <div className="form-group">
                  <label className="form-label">Batch</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Batch 2025-A"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", padding: "12px", marginTop: "8px", fontSize: "0.95rem" }}
          >
            {loading ? "Processing..." : isRegister ? "Create Account" : "Sign In to Platform"}
          </button>
        </form>

        {/* Quick Demo Access Box */}
        <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: "1px solid var(--border-glass)", textAlign: "center" }}>
          <p style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "12px", fontWeight: 700 }}>
            🚀 Instant Demo Access
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => handleDemoLogin("student@demo.com", "password123")}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1 }}
            >
              Demo Student
            </button>
            <button
              onClick={() => handleDemoLogin("admin@demo.com", "password123")}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1 }}
            >
              Demo Admin
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
