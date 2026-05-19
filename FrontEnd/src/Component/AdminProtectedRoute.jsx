import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const AdminProtectedRoute = () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // If no token or the user is not a superadmin, redirect to the login portal
  if (!token || user.role !== "superadmin") {
    return <Navigate to="/login" replace />;
  }

  // Render children routes if authorization checks out
  return <Outlet />;
};

export default AdminProtectedRoute;
