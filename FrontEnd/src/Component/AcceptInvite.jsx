import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { CheckCircle2, XCircle, Layout, ShieldCheck, ChevronRight } from "lucide-react";

const AcceptInvite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const acceptInvitation = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/invitations/accept/${token}`);
        setEmail(res.data.email);
        setStatus("success");
      } catch (error) {
        setStatus("error");
      }
    };
    acceptInvitation();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[480px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Branding */}
        <div className="flex flex-col items-center gap-3">
           <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-xl shadow-slate-900/10">
              <Layout className="text-white" size={24} />
           </div>
           <div className="text-center">
              <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">Herald</h1>
              <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">Invitation Portal</p>
           </div>
        </div>

        {/* Verification Card */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 text-center space-y-8">
          {status === "loading" && (
            <div className="py-12 space-y-6">
               <div className="w-12 h-12 border-4 border-slate-900/5 border-t-slate-900 rounded-full animate-spin mx-auto" />
               <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900">Identifying handshake...</p>
                  <p className="text-xs text-slate-400 font-medium">Verifying invitation credentials.</p>
               </div>
            </div>
          )}

          {status === "success" && (
            <div className="animate-in zoom-in-95 duration-500 space-y-6">
              <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100 shadow-sm">
                 <CheckCircle2 size={40} />
              </div>
              <div className="space-y-2">
                 <h2 className="text-xl font-bold text-slate-900 tracking-tight">Access Granted</h2>
                 <p className="text-sm text-slate-500 font-medium leading-relaxed">
                   You have been successfully added to the workspace as:<br/>
                   <span className="text-slate-900 font-bold">{email}</span>
                 </p>
              </div>
              <div className="pt-4">
                <Link 
                  to="/signup" 
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-slate-900/10 transition-all active:scale-95 flex items-center justify-center gap-2 group/btn"
                >
                  Create Persona <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="animate-in zoom-in-95 duration-500 space-y-6">
              <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto text-rose-600 border border-rose-100 shadow-sm">
                 <XCircle size={40} />
              </div>
              <div className="space-y-2">
                 <h2 className="text-xl font-bold text-slate-900 tracking-tight">Handshake Failed</h2>
                 <p className="text-sm text-slate-500 font-medium">This invitation is no longer valid or has expired.</p>
              </div>
              <div className="pt-4">
                <Link 
                  to="/login" 
                  className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all block"
                >
                  Return to safety
                </Link>
              </div>
            </div>
          )}
        </div>

        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] text-center">
          Encrypted Authentication Sequence v2.0
        </p>
      </div>
    </div>
  );
};

export default AcceptInvite;
