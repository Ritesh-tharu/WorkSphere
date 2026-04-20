import React, { useState, useEffect } from "react";
import axios from "axios";
import { Mail, UserPlus, CheckCircle2, Clock, X, Shield, User, Send, MoreHorizontal, Trash2 } from "lucide-react";

const Team = () => {
  const [email, setEmail] = useState("");
  const [invitations, setInvitations] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchInvitations();
    fetchTeamMembers();
  }, []);

  const fetchInvitations = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/invitations/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvitations(res.data);
    } catch (error) { console.error(error); }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/invitations/team", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeamMembers(res.data);
    } catch (error) { console.error(error); }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(
        "http://localhost:5000/api/invitations/send",
        { email },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setEmail("");
      setShowInviteModal(false);
      fetchInvitations();
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleRemoveMember = async (id) => {
    if (!window.confirm("Are you sure you want to remove this member from your team?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/invitations/team/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTeamMembers();
    } catch (error) { console.error(error); }
  };

  const handleCancelInvite = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this invitation?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/invitations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchInvitations();
    } catch (error) { console.error(error); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-1">
        <div>
          <h1 className="text-4xl font-black text-gradient tracking-tight mb-2">Team Management</h1>
          <p className="text-sm font-medium text-secondary">Collaborate with your workspace members and manage invitations.</p>
        </div>
        <button 
          className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-500/10 hover:opacity-90 active:scale-95"
          onClick={() => setShowInviteModal(true)}
        >
          <UserPlus size={18} />
          <span>Invite Member</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 px-1">
        {/* Active Members */}
        <div className="lg:col-span-2 space-y-8">
           <div className="flex items-center justify-between px-3">
              <h3 className="text-[11px] font-black text-secondary uppercase tracking-[0.3em] flex items-center gap-3">
                Active Workspace Members <span className="bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-md">{teamMembers.length}</span>
              </h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teamMembers.map((member) => (
                <div key={member._id} className="bg-card border border-base rounded-[2rem] p-6 flex items-center gap-5 group shadow-sm hover:shadow-2xl hover:border-indigo-500/30 transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors" />
                  
                  <div className="w-14 h-14 rounded-2xl bg-main border border-base flex items-center justify-center text-xl font-black text-secondary group-hover:bg-slate-900 dark:group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner relative z-10">
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0 relative z-10">
                    <h4 className="text-[15px] font-black text-primary truncate group-hover:text-indigo-600 transition-colors uppercase tracking-tight mb-0.5">{member.name}</h4>
                    <p className="text-[11px] font-bold text-secondary truncate opacity-70 tracking-wide">{member.email}</p>
                  </div>
                   <button 
                    onClick={() => handleRemoveMember(member._id)}
                    className="p-3 bg-main/50 hover:bg-rose-500/10 text-slate-300 hover:text-rose-600 rounded-xl transition-all relative z-10"
                    title="Remove Member"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              ))}
              {!teamMembers.length && (
                 <div className="col-span-full py-24 text-center border-4 border-dashed border-base rounded-[2.5rem] opacity-30 flex flex-col items-center justify-center gap-4">
                    <User size={48} className="text-secondary" />
                    <p className="font-black text-xs uppercase tracking-[0.2em] text-secondary">No active members found</p>
                 </div>
              )}
           </div>
        </div>

        {/* Invitations Panel */}
        <div className="bg-card border border-base rounded-[2.5rem] p-10 shadow-sm h-fit relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
           
           <div className="flex items-center justify-between mb-10">
              <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">
                Pending Invites
              </h3>
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-600 shadow-inner">
                {invitations.length}
              </div>
           </div>
           
           <div className="space-y-4">
              {invitations.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center px-6 bg-main/30 rounded-[2rem] border-2 border-dashed border-base">
                   <Mail className="text-indigo-500 mb-6 opacity-20" size={40} />
                   <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Zero pending links</p>
                </div>
              ) : (
                invitations.map((inv) => (
                  <div key={inv._id} className="group bg-main/50 border border-base p-5 rounded-[1.5rem] hover:border-indigo-500/40 hover:bg-main transition-all flex items-center justify-between shadow-xs">
                     <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-card border border-base flex items-center justify-center text-indigo-500 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                           <Send size={16} />
                        </div>
                        <div className="min-w-0">
                           <p className="text-[11px] font-black text-primary truncate mb-1 tracking-tight">{inv.email}</p>
                           <div className="flex items-center gap-2 text-[9px] font-bold text-secondary uppercase tracking-[0.1em] opacity-60">
                              <Clock size={10} />
                              <span>Sent {new Date(inv.createdAt).toLocaleDateString()}</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-3 pl-2">
                           <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                             inv.status === "pending" ? "text-amber-600 bg-amber-50 border-amber-200" : "text-emerald-600 bg-emerald-50 border-emerald-200"
                           }`}>
                              {inv.status}
                           </div>
                           <button 
                            onClick={() => handleCancelInvite(inv._id)}
                            className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                            title="Cancel Invitation"
                           >
                              <X size={16} />
                           </button>
                        </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setShowInviteModal(false)}>
          <div className="bg-card w-full max-w-lg rounded-[3rem] p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-base animate-in zoom-in-95 duration-300 relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] -mr-32 -mt-32" />
            
            <div className="flex justify-between items-center mb-10 relative z-10">
              <div>
                <h3 className="text-2xl font-black text-primary tracking-tight mb-2">Send Invitation</h3>
                <p className="text-sm font-medium text-secondary">Invite a new member to your team.</p>
              </div>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-secondary hover:bg-main hover:text-primary transition-all shadow-sm border border-base active:scale-90"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-8 relative z-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-secondary tracking-[0.2em] uppercase px-2">Recipient Email Address</label>
                <div className="relative group">
                   <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-main border border-base rounded-[2rem] p-6 pl-16 text-sm text-primary placeholder:text-slate-300 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500/50 outline-none transition-all font-bold"
                    placeholder="teammate@company.com"
                  />
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-6 bg-slate-900 dark:bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-4 group"
              >
                {loading ? "Establishing Link..." : (
                  <>
                    <span>Send Invitation</span>
                    <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;