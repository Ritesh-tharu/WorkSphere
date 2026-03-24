import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./Component/Login";
import Signup from "./Component/Signup";
import Dashboard from "./Component/Dashboard";
import TaskBoard from "./Component/TaskBoard";
import Settings from "./Component/Settings";
import AcceptInvite from "./Component/AcceptInvite";
import ProtectedRoute from "./Component/ProtectedRoute";
import "./App.css";

function App() {
  const token = localStorage.getItem("token");

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Private Routes (Protected) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/taskboard" element={<TaskBoard />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Invitation Route (usually public but handles its own auth) */}
        <Route path="/accept-invite/:token" element={<AcceptInvite />} />
      </Routes>
    </Router>
  );
}

export default App;
