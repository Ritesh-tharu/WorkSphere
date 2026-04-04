import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ChevronRight, Layout } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data));
        navigate("/dashboard");
      } else {
        setError(data.message || "Google authentication failed.");
      }
    } catch (err) {
      setError("Failed to synchronize with Google gateway.");
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
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data));
        navigate("/dashboard");
      } else {
        setError(data.message || "Invalid credentials. Please attempt again.");
      }
    } catch (err) {
      setError("Portal connection failure. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[440px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Branding */}
        <div className="flex flex-col items-center gap-3">
           <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-xl shadow-slate-900/10">
              <Layout className="text-white" size={24} />
           </div>
           <div className="text-center">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">WorkSphere</h1>
              <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">Project Management</p>
           </div>
        </div>

        {/* Login Form */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-10 shadow-xl shadow-slate-200/50 space-y-8">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-sm text-slate-500 font-medium">Please enter your credentials to access the workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google Login Failed")}
                useOneTap
                shape="pill"
                theme="outline"
                size="large"
                width="360"
              />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                  <span className="bg-white px-4 text-slate-400 uppercase">Or continue with email</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Email</label>
               <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={16} />
                  <input 
                    type="email" 
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-medium"
                    placeholder="name@company.com"
                  />
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Password</label>
               <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={16} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-11 py-3 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-medium"
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
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-slate-900/10 transition-all active:scale-95 flex items-center justify-center gap-2 group/btn"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign in <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
             <Link to="/signup" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">
                Don't have an account? <span className="text-slate-900 underline underline-offset-4 decoration-slate-900/10">Sign up</span>
             </Link>
          </div>
        </div>

        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] text-center opacity-50">
          WorkSphere
        </p>
      </div>
    </div>
  );
};

export default Login;
