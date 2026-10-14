import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CareerRoadmap from "./pages/CareerRoadmap";
import Chatbot from "./components/Chatbot";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(auth.role))
    return <p>Unauthorized</p>;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roadmap"
            element={
              <ProtectedRoute allowedRoles={["student", "admin", "trainer"]}>
                <CareerRoadmap />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin", "trainer"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Chatbot />
      </BrowserRouter>
    </AuthProvider>
  );
}
