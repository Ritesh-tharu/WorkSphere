import React, { useState, useEffect } from "react";
import axios from "axios";
import { Mail, UserPlus, CheckCircle2, Clock, X, Shield, User, Send, MoreHorizontal } from "lucide-react";

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

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">Team Workspace</h1>
          <p className="text-sm font-medium text-slate-400">Manage your team members and track active invitations.</p>
        </div>
        <button 
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95"
          onClick={() => setShowInviteModal(true)}
        >
          <UserPlus size={18} />
          <span>Invite member</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-1">
        {/* Active Members */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                Active Members ({teamMembers.length})
              </h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamMembers.map((member) => (
                <div key={member._id} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 group shadow-sm hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg font-bold text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{member.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{member.email}</p>
                  </div>
                  <button className="p-2 text-slate-300 hover:text-slate-600">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              ))}
              {!teamMembers.length && (
                 <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl opacity-40">
                    <p className="font-bold text-xs uppercase tracking-widest text-slate-500">No active members found</p>
                 </div>
              )}
           </div>
        </div>

        {/* Invitations */}
        <div className="space-y-6">
           <div className="px-1">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                Sent Invitations
              </h3>
           </div>

           <div className="bg-white border border-slate-200 rounded-2xl p-2 flex flex-col gap-1 shadow-sm">
              {invitations.map((invite) => (
                <div key={invite._id} className="flex flex-col gap-2 p-4 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                    <div className="flex items-start justify-between">
                       <p className="text-xs font-bold text-slate-800 truncate pr-2">{invite.email}</p>
                       <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight ${
                         invite.status === "pending" ? "text-amber-600 bg-amber-50" : "text-emerald-600 bg-emerald-50"
                       }`}>
                          {invite.status}
                       </div>
                    </div>
                    <time className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Sent on {new Date(invite.createdAt).toLocaleDateString()}</time>
                </div>
              ))}
              {!invitations.length && (
                 <div className="py-12 text-center opacity-30">
                    <Mail size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-[10px] uppercase tracking-widest">No pending invites</p>
                 </div>
              )}
           </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowInviteModal(false)}>
           <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl p-8 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-6">
                 <h2 className="text-xl font-bold text-slate-900 tracking-tight">Invite to Workspace</h2>
                 <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleSendInvite} className="space-y-6">
                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Recipient Email *</label>
                    <input
                       type="email"
                       placeholder="colleague@company.com"
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       required
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all font-medium"
                    />
                 </div>
                 <div className="flex gap-3 pt-4">
                    <button type="button" className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all text-sm" onClick={() => setShowInviteModal(false)}>Cancel</button>
                    <button type="submit" disabled={loading} className="flex-[2] py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95">
                       {loading ? "Sending…" : "Send invite"}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Team;
