import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ChevronRight,
  Layout,
  ShieldCheck,
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import axiosInstance from "../api/axiosInstance";

const Login = () => {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState("user"); // "user" or "admin"

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (token) {
      if (user.role === "superadmin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [navigate]);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Updated handleGoogleSuccess for redirect mode
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      let idToken = credentialResponse?.credential;

      // For redirect mode - get token from URL hash if not in credentialResponse
      if (!idToken && window.location.hash) {
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1),
        );
        idToken = hashParams.get("id_token");
      }

      if (!idToken) {
        throw new Error("No ID token received");
      }

      const response = await axiosInstance.post("/auth/google", {
        idToken: idToken,
      });
      const data = response.data;

      // Clear URL hash after successful login to keep URL clean
      if (window.location.hash) {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }

      if (data.requiresVerification) {
        navigate("/verify-otp", { state: { email: data.email } });
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Google authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.post("/auth/login", formData);
      const data = response.data;

      if (loginType === "admin") {
        // Crucial Role Verification
        if (data.role !== "superadmin") {
          setError(
            "Access Denied: You do not have Super Administrator privileges.",
          );
          return;
        }
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data));
        navigate("/admin/dashboard");
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data));
        navigate("/dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Invalid credentials. Please attempt again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[440px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Branding */}
        <div className="flex flex-col items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-xl transition-all duration-500 ${
              loginType === "admin"
                ? "bg-indigo-600 shadow-indigo-600/10"
                : "bg-slate-900 shadow-slate-900/10"
            }`}
          >
            {loginType === "admin" ? (
              <ShieldCheck
                className="text-white animate-in zoom-in-50 duration-300"
                size={24}
              />
            ) : (
              <Layout
                className="text-white animate-in zoom-in-50 duration-300"
                size={24}
              />
            )}
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
              WorkSphere
            </h1>
            <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
              Project Management
            </p>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-10 shadow-xl shadow-slate-200/50 space-y-8">
          {/* Portal Switcher Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl relative border border-slate-250/20">
            <button
              type="button"
              onClick={() => {
                setLoginType("user");
                setError("");
              }}
              className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                loginType === "user"
                  ? "bg-white text-slate-900 shadow-md shadow-slate-200"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <Layout size={13} />
              User Project
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginType("admin");
                setError("");
              }}
              className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                loginType === "admin"
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <ShieldCheck size={13} />
              Admin Login
            </button>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {loginType === "admin" ? "Admin Portal" : "Welcome back"}
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              {loginType === "admin"
                ? "Enter system for the admin panel."
                : "Please enter your credentials to access the workspace."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {loginType === "user" && (
              <div className="space-y-4">
                {/* UPDATED: Added ux_mode="redirect" to fix COOP error */}
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    console.error(
                      "Google Login Failed. Check if origin is whitelisted in Google Cloud Console.",
                    );
                    setError(
                      "Google Authentication failed. Please ensure the origin is whitelisted.",
                    );
                  }}
                  shape="pill"
                  theme="outline"
                  size="large"
                  text="signin_with"
                  width="360"
                  ux_mode="redirect"
                  redirect_uri={`${window.location.origin}/login`}
                />
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                    <span className="bg-white px-4 text-slate-400 uppercase">
                      Or continue with email
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                Email
              </label>
              <div className="relative group">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors"
                  size={16}
                />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-medium outline-none"
                  placeholder={
                    loginType === "admin"
                      ? "admin@worksphere.com"
                      : "name@company.com"
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                Password
              </label>
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors"
                  size={16}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-11 py-3 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-medium outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[11px] font-bold text-center animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 group/btn cursor-pointer ${
                loginType === "admin"
                  ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20"
                  : "bg-slate-900 hover:bg-slate-800 shadow-slate-900/10"
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {loginType === "admin" ? "Enter Admin Dashboard" : "Sign in"}
                  <ChevronRight
                    size={14}
                    className="group-hover/btn:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </form>

          {loginType === "user" && (
            <div className="pt-2 text-center">
              <Link
                to="/signup"
                className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors"
              >
                Don't have an account?{" "}
                <span className="text-slate-900 underline underline-offset-4 decoration-slate-900/10">
                  Sign up
                </span>
              </Link>
            </div>
          )}
        </div>

        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] text-center opacity-50">
          WorkSphere
        </p>
      </div>
    </div>
  );
};

export default Login;
