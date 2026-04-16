import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  ShieldCheck, 
  ArrowLeft, 
  RefreshCcw, 
  ChevronRight, 
  Layout,
  Mail,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate("/signup");
    }
  }, [email, navigate]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1); // last character matra linx
    setOtp(newOtp);

    // Focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpString }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess("Verification successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(data.message || "Invalid verification code.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;
    setResending(true);
    setError("");
    try {
      const response = await fetch("http://localhost:5000/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess("New verification code sent to your email.");
        setTimer(60);
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(data.message || "Failed to resend code.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-[480px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Branding */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 bg-slate-900 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-slate-900/20">
            <Layout className="text-white" size={28} />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">WorkSphere</h1>
            <p className="text-[10px] font-bold tracking-[0.25em] text-slate-400 uppercase">Secure Verification</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 overflow-hidden">
          <div className="p-10 space-y-8">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <ShieldCheck className="text-slate-900" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Identity Verification</h2>
              <p className="text-sm text-slate-500 font-medium">
                We've sent a 6-digit code to <br />
                <span className="text-slate-900 font-bold">{email}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="flex justify-between gap-2 sm:gap-3">
                {otp.map((data, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength="1"
                    value={data}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-black bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all outline-none"
                  />
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[11px] font-bold animate-in shake duration-500">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-[11px] font-bold animate-in zoom-in duration-300">
                  <CheckCircle2 size={14} />
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.some(v => v === "")}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 group/btn"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Verify Account <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" /></>
                )}
              </button>
            </form>

            <div className="text-center space-y-4">
              <p className="text-xs text-slate-500 font-medium">
                Didn't receive the code?{" "}
                {timer > 0 ? (
                  <span className="text-slate-400 font-bold">Resend in {timer}s</span>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="text-slate-900 font-black hover:underline underline-offset-4 decoration-slate-900/20"
                  >
                    Resend Code
                  </button>
                )}
              </p>
              
              <Link to="/signup" className="inline-flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">
                <ArrowLeft size={12} />
                Back to registration
              </Link>
            </div>
          </div>
        </div>

        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] text-center opacity-50">
          WorkSphere Unified Gateway
        </p>
      </div>
    </div>
  );
};

export default VerifyOTP;
