import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, User, Phone, ChevronRight, Layout, CheckCircle2 } from "lucide-react";

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setSubmitError("");
  };

  const validate = () => {
    let newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!/^\d{10}$/.test(formData.phoneNumber)) newErrors.phoneNumber = "10-digit phone required";
    if (!formData.email.includes("@")) newErrors.email = "Invalid email target";
    if (formData.password.length < 6) newErrors.password = "Min 6 characters";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords mismatch";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phoneNumber,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        navigate("/login");
      } else {
        setSubmitError(data.message || "Registration failed.");
      }
    } catch (err) {
      setSubmitError("Portal connection failure.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[520px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Branding */}
        <div className="flex flex-col items-center gap-3">
           <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-xl shadow-slate-900/10">
              <Layout className="text-white" size={24} />
           </div>
           <div className="text-center">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Herald</h1>
              <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">Join the Workspace</p>
           </div>
        </div>

        {/* Signup Form */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 space-y-8">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create your account</h2>
            <p className="text-sm text-slate-500 font-medium">Join our mission-driven team today.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                  <div className="relative group">
                     <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={16} />
                     <input 
                       name="name"
                       required
                       value={formData.name}
                       onChange={handleChange}
                       className={`w-full bg-slate-50 border rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-medium ${errors.name ? 'border-rose-400' : 'border-slate-200'}`}
                       placeholder="Alex Doe"
                     />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Phone</label>
                  <div className="relative group">
                     <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={16} />
                     <input 
                       name="phoneNumber"
                       required
                       value={formData.phoneNumber}
                       onChange={handleChange}
                       className={`w-full bg-slate-50 border rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-medium ${errors.phoneNumber ? 'border-rose-400' : 'border-slate-200'}`}
                       placeholder="1234567890"
                     />
                  </div>
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Email</label>
               <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={16} />
                  <input 
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full bg-slate-50 border rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-medium ${errors.email ? 'border-rose-400' : 'border-slate-200'}`}
                    placeholder="name@company.com"
                  />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Password</label>
                  <div className="relative group">
                     <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={16} />
                     <input 
                       name="password"
                       type={showPassword ? "text" : "password"}
                       required
                       value={formData.password}
                       onChange={handleChange}
                       className={`w-full bg-slate-50 border rounded-xl pl-11 pr-11 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-medium ${errors.password ? 'border-rose-400' : 'border-slate-200'}`}
                       placeholder="••••••••"
                     />
                     <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                     </button>
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Confirm</label>
                  <div className="relative group">
                     <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={16} />
                     <input 
                       name="confirmPassword"
                       type={showConfirmPassword ? "text" : "password"}
                       required
                       value={formData.confirmPassword}
                       onChange={handleChange}
                       className={`w-full bg-slate-50 border rounded-xl pl-11 pr-11 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-medium ${errors.confirmPassword ? 'border-rose-400' : 'border-slate-200'}`}
                       placeholder="••••••••"
                     />
                     <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors">
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                     </button>
                  </div>
               </div>
            </div>

            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[11px] font-bold text-center">
                 {submitError}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-slate-900/10 transition-all active:scale-95 flex items-center justify-center gap-2 group/btn mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>Establish Persona <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
             <Link to="/login" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">
                Already registered? <span className="text-slate-900 underline underline-offset-4 decoration-slate-900/10">Initiate Uplink</span>
             </Link>
          </div>
        </div>

        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] text-center">
          Encrypted Registration Sequence v4.0
        </p>
      </div>
    </div>
  );
};

export default Signup;
