import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  ChevronRight, 
  Layout, 
  CheckCircle2, 
  AlertCircle,
  Globe
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard", { replace: true });
    }
    
    // Check for pre-filled email from Landing page
    if (location.state?.initialEmail) {
      setFormData(prev => ({ ...prev, email: location.state.initialEmail }));
    }
  }, [navigate, location]);

  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const calculateStrength = (pass) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length > 6) score += 1;
    if (pass.length > 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score; // Max 5
  };

  const strengthLabels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
  const strengthColors = [
    "bg-slate-200", 
    "bg-rose-400", 
    "bg-amber-400", 
    "bg-blue-400", 
    "bg-emerald-400"
  ];

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "name":
        if (!value.trim()) error = "Full name is required";
        break;
      case "email":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Invalid email address";
        break;
      case "phoneNumber":
        if (!/^\d{10}$/.test(value)) error = "10-digit number required";
        break;
      case "password":
        if (value.length < 6) error = "Minimum 6 characters";
        break;
      case "confirmPassword":
        if (value !== formData.password) error = "Passwords do not match";
        break;
      case "agreeTerms":
        if (!value) error = "You must agree to the terms";
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    
    setFormData(prev => ({ ...prev, [name]: val }));
    
    // Real-time validation
    const error = validateField(name, val);
    setErrors(prev => ({ ...prev, [name]: error }));
    
    if (name === "password") {
      setPasswordStrength(calculateStrength(val));
      if (formData.confirmPassword) {
        setErrors(prev => ({ 
          ...prev, 
          confirmPassword: val !== formData.confirmPassword ? "Passwords do not match" : "" 
        }));
      }
    }

    setSubmitError("");
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setSubmitError("");
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
        setSuccess(true);
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        setSubmitError(data.message || "Google registration failed.");
      }
    } catch (err) {
      setSubmitError("Failed to synchronize with Google gateway.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Final validation check
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

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
        setSuccess(true);
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setSubmitError(data.message || "Registration failed. Please check your details.");
      }
    } catch (err) {
      setSubmitError("Network synchronization failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    if (provider === "Google") return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitError(`${provider} synchronization under maintenance.`);
    }, 1000);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-[440px] bg-white border border-slate-200 rounded-[2.5rem] p-12 shadow-2xl shadow-slate-200/50 text-center space-y-6 animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="text-emerald-500" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome to WorkSphere</h2>
          <p className="text-slate-500">Your account has been successfully created. Redirecting you to the workspace terminal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4 sm:p-6 font-sans overflow-x-hidden">
      <div className="w-full max-w-[500px] space-y-6 sm:space-y-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header Section */}
        <div className="flex flex-col items-center gap-4">
          <Link to="/" className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 bg-slate-900 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-slate-900/20 group-hover:scale-105 transition-transform duration-300">
              <Layout className="text-white" size={28} />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">WorkSphere</h1>
              <p className="text-[10px] font-bold tracking-[0.25em] text-slate-400 uppercase">Unified Workspace</p>
            </div>
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 overflow-hidden">
          <div className="p-8 sm:p-10 space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h2>
              <p className="text-sm text-slate-500 font-medium">Streamline your team's productivity today.</p>
            </div>

            {/* Social Logins */}
            <div className="flex flex-col gap-3">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setStatus({ type: "error", message: "Google Signup Failed" })}
                useOneTap
                theme="outline"
                shape="pill"
                size="large"
                text="signup_with"
                width="360"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                <span className="bg-white px-4 text-slate-400 font-black">Or continue with email</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative group">
                    <User className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.name ? 'text-rose-400' : 'text-slate-300 group-focus-within:text-slate-900'}`} size={16} />
                    <input 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full bg-slate-50/50 border rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-medium ${errors.name ? 'border-rose-400 ring-rose-400/5' : 'border-slate-200'}`}
                      placeholder="Alex Rivera"
                    />
                  </div>
                  {errors.name && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.name}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                  <div className="relative group">
                    <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.phoneNumber ? 'text-rose-400' : 'text-slate-300 group-focus-within:text-slate-900'}`} size={16} />
                    <input 
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className={`w-full bg-slate-50/50 border rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-medium ${errors.phoneNumber ? 'border-rose-400 ring-rose-400/5' : 'border-slate-200'}`}
                      placeholder="10-digit number"
                    />
                  </div>
                  {errors.phoneNumber && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.phoneNumber}</p>}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Email</label>
                <div className="relative group">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.email ? 'text-rose-400' : 'text-slate-300 group-focus-within:text-slate-900'}`} size={16} />
                  <input 
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full bg-slate-50/50 border rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-medium ${errors.email ? 'border-rose-400 ring-rose-400/5' : 'border-slate-200'}`}
                    placeholder="name@company.com"
                  />
                </div>
                {errors.email && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.email}</p>}
              </div>

              {/* Password Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative group">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.password ? 'text-rose-400' : 'text-slate-300 group-focus-within:text-slate-900'}`} size={16} />
                    <input 
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full bg-slate-50/50 border rounded-xl pl-11 pr-11 py-3 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-medium ${errors.password ? 'border-rose-400 ring-rose-400/5' : 'border-slate-200'}`}
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="flex gap-1 mt-1.5 px-0.5">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <div key={lvl} className={`h-1 flex-1 rounded-full transition-all duration-500 ${passwordStrength >= lvl ? strengthColors[passwordStrength-1] : 'bg-slate-100'}`} />
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm</label>
                  <div className="relative group">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.confirmPassword ? 'text-rose-400' : 'text-slate-300 group-focus-within:text-slate-900'}`} size={16} />
                    <input 
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full bg-slate-50/50 border rounded-xl pl-11 pr-11 py-3 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-medium ${errors.confirmPassword ? 'border-rose-400 ring-rose-400/5' : 'border-slate-200'}`}
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors">
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Terms */}
              <div className="pt-2">
                <label className="flex items-start gap-3 group cursor-pointer">
                  <div className="relative flex items-center mt-0.5">
                    <input 
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      className="peer h-4 w-4 rounded-md border-slate-200 bg-slate-50 text-slate-900 focus:ring-slate-90/10 cursor-pointer appearance-none checked:bg-slate-900 checked:border-slate-900 transition-all"
                    />
                    <CheckCircle2 className="absolute text-white hidden peer-checked:block pointer-events-none" size={12} />
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium leading-tight">
                    I agree to the <span className="text-slate-900 font-bold hover:underline">Terms of Service</span>.
                  </span>
                </label>
              </div>

              {submitError && (
                <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[11px] font-bold text-center">
                   <AlertCircle size={14} />
                   {submitError}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 group/btn mt-4"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Create Workspace Account <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" /></>
                )}
              </button>
            </form>
          </div>
          
          <div className="bg-slate-50/50 border-t border-slate-100 p-6 text-center">
             <Link to="/login" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                Already part of a team? <span className="text-slate-900 underline underline-offset-4 decoration-slate-900/10 font-black">Sign in here</span>
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

export default Signup;
