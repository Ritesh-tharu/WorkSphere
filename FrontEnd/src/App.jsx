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
import AcceptInvite from "./Component/AcceptInvite";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/taskboard" element={<TaskBoard />} />
        <Route path="/accept-invite/:token" element={<AcceptInvite />} />
      </Routes>
    </Router>
  );
}

export default App;
