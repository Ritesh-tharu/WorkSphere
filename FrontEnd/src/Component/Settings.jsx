import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Camera,
  ChevronRight,
  Fingerprint,
  Palette,
  Volume2,
  Save,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  Phone,
  Calendar,
} from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
    location: "",
    jobTitle: "",
    bio: "",
    profilePhoto: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const token = localStorage.getItem("token");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser({
        name: parsedUser.name || "",
        email: parsedUser.email || "",
        phoneNumber: parsedUser.phoneNumber || "",
        dateOfBirth: parsedUser.dateOfBirth ? parsedUser.dateOfBirth.split('T')[0] : "",
        location: parsedUser.location || "",
        jobTitle: parsedUser.jobTitle || "",
        bio: parsedUser.bio || "",
        profilePhoto: parsedUser.profilePhoto || "",
      });
      if (parsedUser.profilePhoto) {
        setPhotoPreview(`http://localhost:5000${parsedUser.profilePhoto}`);
      }
    }
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const formData = new FormData();
      Object.keys(user).forEach(key => {
        if (user[key]) formData.append(key, user[key]);
      });
      if (photoFile) formData.append("profilePhoto", photoFile);
      
      const res = await axios.put("http://localhost:5000/api/auth/update-profile", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      localStorage.setItem("user", JSON.stringify(res.data));
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error) { 
      console.error(error); 
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to update profile." });
    } finally { setLoading(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      await axios.put("http://localhost:5000/api/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage({ type: "success", text: "Password updated successfully!" });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to update password." });
    } finally { setLoading(false); }
  };

  const TABS = [
    { id: "profile", label: "Profile", Icon: User },
    { id: "security", label: "Security", Icon: Fingerprint },
    { id: "appearance", label: "Appearance", Icon: Palette },
    { id: "notifications", label: "Alerts", Icon: Volume2 },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <button 
                onClick={() => navigate("/dashboard")}
                className="p-2 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
            </div>
            <p className="text-sm font-medium text-slate-400">Manage your profile, security protocols, and workspace aesthetics.</p>
          </div>
          
          {message.text && (
            <div className={`px-4 py-2 rounded-xl text-sm font-bold animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
              {message.text}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 px-1">
          {/* Sidebar Tabs */}
          <aside className="lg:col-span-1 space-y-1">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setMessage({ type: "", text: "" }); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${activeTab === id ? 'bg-white shadow-sm text-slate-900 font-bold border border-slate-200' : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-900'}`}
              >
                <Icon size={18} className={activeTab === id ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600"} />
                <span className="text-sm flex-1 text-left">{label}</span>
                {activeTab === id && <ChevronRight size={14} className="text-slate-300" />}
              </button>
            ))}
          </aside>

          {/* Tab Content */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-10">
              
              {activeTab === "profile" && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="flex flex-col md:flex-row items-center gap-10">
                     <div className="relative group shrink-0">
                        <div className="w-28 h-28 rounded-2xl bg-white border border-slate-200 p-1 shadow-md">
                           <div className="w-full h-full rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                              {photoPreview ? (
                                <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                              ) : (
                                <User size={32} className="text-slate-300" />
                              )}
                           </div>
                        </div>
                        <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-lg transition-all scale-100 hover:scale-110 active:scale-95 border-2 border-white">
                           <Camera size={14} />
                           <input type="file" className="hidden" onChange={handlePhotoChange} accept="image/*" />
                        </label>
                     </div>
                     <div className="text-center md:text-left">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Profile Identity</h3>
                        <p className="text-sm font-medium text-slate-400">Update your tactical nomenclature and bio signals.</p>
                     </div>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Full Name</label>
                        <div className="relative">
                          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all font-medium" value={user.name} onChange={e => setUser({...user, name: e.target.value})} placeholder="Tactical Operator" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Email Address</label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all font-medium" value={user.email} onChange={e => setUser({...user, email: e.target.value})} placeholder="operator@herald.com" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Phone Number</label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all font-medium" value={user.phoneNumber} onChange={e => setUser({...user, phoneNumber: e.target.value})} placeholder="98XXXXXXXX" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Date of Birth</label>
                        <div className="relative">
                          <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all font-medium" value={user.dateOfBirth} onChange={e => setUser({...user, dateOfBirth: e.target.value})} />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Job Title</label>
                        <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all font-medium" value={user.jobTitle} onChange={e => setUser({...user, jobTitle: e.target.value})} placeholder="Lead Architect" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Location</label>
                        <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all font-medium" value={user.location} onChange={e => setUser({...user, location: e.target.value})} placeholder="City, Country" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Biography</label>
                      <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all font-medium min-h-[120px] resize-none" value={user.bio} onChange={e => setUser({...user, bio: e.target.value})} placeholder="Tell us about yourself..." />
                    </div>

                    <div className="flex pt-4">
                      <button type="submit" disabled={loading} className="flex items-center gap-2 px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 disabled:opacity-50">
                         <Save size={16} />
                         {loading ? "Syncing…" : "Save Profile"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                      <Lock size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Security Credentials</h3>
                      <p className="text-sm font-medium text-slate-400">Manage your encryption keys and access protocols.</p>
                    </div>
                  </div>

                  <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Current Password</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type={showPasswords.current ? "text" : "password"} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-11 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all font-medium" 
                          value={passwordData.currentPassword} 
                          onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} 
                          required 
                        />
                        <button type="button" onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">New Password</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type={showPasswords.new ? "text" : "password"} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-11 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all font-medium" 
                          value={passwordData.newPassword} 
                          onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} 
                          required 
                        />
                        <button type="button" onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Confirm New Password</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type={showPasswords.confirm ? "text" : "password"} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-11 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all font-medium" 
                          value={passwordData.confirmPassword} 
                          onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} 
                          required 
                        />
                        <button type="button" onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex pt-4">
                      <button type="submit" disabled={loading} className="flex items-center gap-2 px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 disabled:opacity-50">
                         <Lock size={16} />
                         {loading ? "Securing…" : "Update Password"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === "appearance" && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <Palette size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Workspace Aesthetics</h3>
                      <p className="text-sm font-medium text-slate-400">Configure your visual interface and color modules.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-6 rounded-2xl border-2 border-slate-900 bg-white shadow-sm space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">Light Protocol</span>
                        <div className="w-4 h-4 rounded-full bg-slate-900" />
                      </div>
                      <p className="text-xs text-slate-500">Optimized for high-visibility tactical operations during daylight cycles.</p>
                      <span className="inline-block px-3 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600">ACTIVE</span>
                    </div>

                    <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 opacity-60 space-y-4 grayscale">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-400">Shadow Mode</span>
                        <div className="w-4 h-4 rounded-full bg-slate-200" />
                      </div>
                      <p className="text-xs text-slate-400">Stealth interface for low-light environment engagement. (In Development)</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="py-20 text-center opacity-40 animate-in fade-in duration-300">
                  <Volume2 size={48} className="mx-auto mb-4 text-slate-300" />
                  <p className="text-sm font-bold uppercase tracking-widest">Alert signal protocols are currently locked</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

