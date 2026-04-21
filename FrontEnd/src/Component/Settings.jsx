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
  Trash2,
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
  const [removePhoto, setRemovePhoto] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [alerts, setAlerts] = useState({
    desktop: localStorage.getItem("alerts_desktop") === "true",
    sound: localStorage.getItem("alerts_sound") === "true",
  });

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
      if (parsedUser.notificationPreferences) {
        setAlerts({
          desktop: parsedUser.notificationPreferences.desktop ?? true,
          sound: parsedUser.notificationPreferences.sound ?? true,
        });
      }
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

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setRemovePhoto(true);
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
      if (removePhoto) formData.append("removePhoto", "true");

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

  const handleThemeToggle = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const handleAlertToggle = async (type) => {
    if (type === "desktop" && !alerts.desktop) {
      if (!("Notification" in window)) {
        setMessage({ type: "error", text: "This browser DOES NOT support desktop notifications." });
        return;
      }

      if (Notification.permission === "denied") {
        setMessage({ type: "error", text: "Notifications are BLOCKED by your browser. Please unblock them in the address bar (lock icon) to enable alerts." });
        return;
      }

      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setMessage({ type: "error", text: "Permission was not granted for notifications." });
          return;
        }
      } catch (err) {
        console.error("Notification permission request failed:", err);
        setMessage({ type: "error", text: "Failed to request notification permission." });
        return;
      }
    }

    const newAlerts = { ...alerts, [type]: !alerts[type] };
    setAlerts(newAlerts);

    // Persist to backend
    try {
      const res = await axios.put("http://localhost:5000/api/auth/update-profile", {
        notificationPreferences: newAlerts
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.setItem("user", JSON.stringify(res.data));
      if (newAlerts.desktop && type === "desktop") {
        new Notification("WorkSphere", { body: "Desktop notifications are now active!", icon: "/favicon.ico" });
      }
    } catch (error) {
      console.error("Failed to save alert settings:", error);
    }
  };

  const testNotification = () => {
    if (!("Notification" in window)) {
      setMessage({ type: "error", text: "Notifications are not supported in this browser." });
      return;
    }

    if (alerts.desktop) {
      if (Notification.permission === "granted") {
        try {
          new Notification("WorkSphere Test", {
            body: "This is a test notification from WorkSphere.",
            icon: "/favicon.ico"
          });
        } catch (e) {
          console.error("Notification error:", e);
          setMessage({ type: "error", text: "Could not trigger notification. Make sure permissions are allowed." });
        }
      } else {
        setMessage({ type: "error", text: `Notifications are ${Notification.permission}. Toggle help: click the 'lock' icon in the URL bar.` });
      }
    }

    if (alerts.sound) {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.play().catch(e => {
        console.error("Audio play failed:", e);
        setMessage({ type: "error", text: "Audio playback failed - check your browser's auto-play settings." });
      });
    }
  };

  return (
    <div className="min-h-screen bg-main/50 p-6 md:p-12 animate-in fade-in duration-700">
      <div className="   mx-auto space-y-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-3 bg-card border border-base rounded-2xl text-secondary hover:text-primary hover:shadow-md transition-all active:scale-95"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-4xl font-black tracking-tight mb-2 text-gradient">Settings</h1>
              <p className="text-sm font-medium text-secondary">Manage your account preferences and workspace configuration.</p>
            </div>
          </div>

          {message.text && (
            <div className={`px-5 py-3 rounded-2xl text-sm font-bold animate-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'}`}>
              {message.text}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 px-1">
          {/* Sidebar Tabs */}
          <aside className="lg:col-span-1 space-y-2">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setMessage({ type: "", text: "" }); }}
                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all group ${activeTab === id ? 'bg-card shadow-lg text-primary font-bold border border-base border-b-2 border-b-indigo-500/50' : 'text-secondary hover:bg-card/50 hover:text-primary'}`}
              >
                <Icon size={18} className={activeTab === id ? "text-indigo-500" : "text-slate-400 group-hover:text-indigo-400"} />
                <span className="text-[13px] font-bold uppercase tracking-widest flex-1 text-left">{label}</span>
                {activeTab === id && <ChevronRight size={14} className="text-indigo-300" />}
              </button>
            ))}
          </aside>

          {/* Tab Content */}
          <div className="lg:col-span-3">
            <div className="bg-card border border-base rounded-[2.5rem] shadow-sm p-8 md:p-12 relative overflow-hidden group/content">
              {/* Subtle accent blur */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none group-hover/content:bg-indigo-500/10 transition-colors" />

              {activeTab === "profile" && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="relative shrink-0">
                      <div className="w-32 h-32 rounded-3xl bg-main border border-base p-1.5 shadow-inner">
                        <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-base/50">
                          {photoPreview ? (
                            <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <User size={40} className="text-slate-200" />
                          )}
                        </div>
                      </div>
                      <div className="absolute -bottom-2 -right-2 flex gap-1">
                        <label className="w-10 h-10 bg-slate-900 dark:bg-indigo-600 hover:opacity-90 text-white rounded-2xl flex items-center justify-center cursor-pointer shadow-xl transition-all scale-100 hover:scale-110 active:scale-95 border-4 border-card" title="Change Photo">
                          <Camera size={16} />
                          <input type="file" className="hidden" onChange={handlePhotoChange} accept="image/*" />
                        </label>
                        {photoPreview && (
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="w-10 h-10 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl flex items-center justify-center cursor-pointer shadow-xl transition-all scale-100 hover:scale-110 active:scale-95 border-4 border-card"
                            title="Remove Photo"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-center md:text-left">
                      <h3 className="text-2xl font-black text-primary tracking-tight mb-2">Account Profile</h3>
                      <p className="text-sm font-medium text-secondary max-w-sm leading-relaxed">Customize how you're seen across WorkSphere workspaces.</p>
                    </div>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] block px-1">Full Name</label>
                        <div className="relative group">
                          <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                          <input className="w-full bg-main border border-base rounded-2xl pl-12 pr-4 py-4 text-sm text-primary focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/50 outline-none transition-all font-bold" value={user.name} onChange={e => setUser({ ...user, name: e.target.value })} placeholder="Alex Johnson" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] block px-1">Email Address</label>
                        <div className="relative group">
                          <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                          <input className="w-full bg-main border border-base rounded-2xl pl-12 pr-4 py-4 text-sm text-primary focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/50 outline-none transition-all font-bold" value={user.email} onChange={e => setUser({ ...user, email: e.target.value })} placeholder="alex@worksphere.com" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] block px-1">Phone Number</label>
                        <div className="relative group">
                          <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                          <input className="w-full bg-main border border-base rounded-2xl pl-12 pr-4 py-4 text-sm text-primary focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/50 outline-none transition-all font-bold" value={user.phoneNumber} onChange={e => setUser({ ...user, phoneNumber: e.target.value })} placeholder="+1 (555) 000-0000" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] block px-1">Date of Birth</label>
                        <div className="relative group">
                          <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                          <input type="date" className="w-full bg-main border border-base rounded-2xl pl-12 pr-4 py-4 text-sm text-primary focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/50 outline-none transition-all font-bold" value={user.dateOfBirth} onChange={e => setUser({ ...user, dateOfBirth: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] block px-1">Job Title</label>
                        <input className="w-full bg-main border border-base rounded-2xl px-5 py-4 text-sm text-primary focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/50 outline-none transition-all font-bold" value={user.jobTitle} onChange={e => setUser({ ...user, jobTitle: e.target.value })} placeholder="Senior Product Designer" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] block px-1">Location</label>
                        <input className="w-full bg-main border border-base rounded-2xl px-5 py-4 text-sm text-primary focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/50 outline-none transition-all font-bold" value={user.location} onChange={e => setUser({ ...user, location: e.target.value })} placeholder="San Francisco, CA" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] block px-1">Biography</label>
                      <textarea className="w-full bg-main border border-base rounded-3xl px-6 py-5 text-sm text-primary focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/50 outline-none transition-all font-medium min-h-[140px] resize-none leading-relaxed" value={user.bio} onChange={e => setUser({ ...user, bio: e.target.value })} placeholder="A short bio about yourself..." />
                    </div>

                    <div className="flex pt-6">
                      <button type="submit" disabled={loading} className="flex items-center gap-3 px-10 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-500/20 hover:opacity-90 active:scale-95 disabled:opacity-50">
                        <Save size={18} />
                        {loading ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600">
                      <Lock size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-primary tracking-tight mb-1">Security & Password</h3>
                      <p className="text-sm font-medium text-secondary">Manage your authentication methods and data safety.</p>
                    </div>
                  </div>

                  <form onSubmit={handlePasswordChange} className="space-y-8 max-w-md">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] block px-1">Current Password</label>
                      <div className="relative group">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                          type={showPasswords.current ? "text" : "password"}
                          className="w-full bg-main border border-base rounded-2xl pl-12 pr-12 py-4 text-sm text-primary focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/50 outline-none transition-all font-bold"
                          value={passwordData.currentPassword}
                          onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          required
                        />
                        <button type="button" onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors">
                          {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] block px-1">New Password</label>
                      <div className="relative group">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          className="w-full bg-main border border-base rounded-2xl pl-12 pr-12 py-4 text-sm text-primary focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/50 outline-none transition-all font-bold"
                          value={passwordData.newPassword}
                          onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          required
                        />
                        <button type="button" onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors">
                          {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] block px-1">Confirm New Password</label>
                      <div className="relative group">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          className="w-full bg-main border border-base rounded-2xl pl-12 pr-12 py-4 text-sm text-primary focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/50 outline-none transition-all font-bold"
                          value={passwordData.confirmPassword}
                          onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          required
                        />
                        <button type="button" onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors">
                          {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex pt-6">
                      <button type="submit" disabled={loading} className="flex items-center gap-3 px-10 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl hover:opacity-90 active:scale-95 disabled:opacity-50">
                        <Lock size={18} />
                        {loading ? "Updating..." : "Change Password"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === "appearance" && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600">
                      <Palette size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-primary tracking-tight mb-1">Visual Appearance</h3>
                      <p className="text-sm font-medium text-secondary">Customize your workspace aesthetic and theme.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <button
                      onClick={() => handleThemeToggle("light")}
                      className={`p-8 rounded-[2rem] border-2 transition-all text-left space-y-5 relative overflow-hidden group/theme ${theme === 'light' ? 'border-indigo-500 bg-white shadow-2xl shadow-indigo-500/10' : 'border-base bg-main opacity-50 grayscale hover:grayscale-0 hover:opacity-100 hover:border-indigo-500/30'}`}
                    >
                      <div className="flex justify-between items-center relative z-10">
                        <span className={`text-[13px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-primary' : 'text-secondary'}`}>Light Mode</span>
                        <div className={`w-5 h-5 rounded-full border-4 border-white ${theme === 'light' ? 'bg-indigo-500 shadow-md ring-4 ring-indigo-500/20' : 'bg-slate-200'}`} />
                      </div>
                      <div className="bg-slate-100 h-24 rounded-xl border border-slate-200 relative z-10 overflow-hidden">
                        <div className="w-1/3 h-full bg-white border-r border-slate-200 p-2 space-y-2">
                          <div className="w-full h-2 bg-slate-100 rounded-full" />
                          <div className="w-2/3 h-2 bg-slate-100 rounded-full" />
                        </div>
                      </div>
                      <p className={`text-xs font-medium leading-relaxed relative z-10 ${theme === 'light' ? 'text-secondary' : 'text-slate-400'}`}>Clean and vibrant interface optimized for high productivity during daytime.</p>
                    </button>

                    <button
                      onClick={() => handleThemeToggle("dark")}
                      className={`p-8 rounded-[2rem] border-2 transition-all text-left space-y-5 relative overflow-hidden group/theme ${theme === 'dark' ? 'border-indigo-500 bg-slate-900 shadow-2xl shadow-indigo-500/20' : 'border-base bg-main opacity-50 grayscale hover:grayscale-0 hover:opacity-100 hover:border-indigo-500/30'}`}
                    >
                      <div className="flex justify-between items-center relative z-10">
                        <span className={`text-[13px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-secondary'}`}>Dark Mode</span>
                        <div className={`w-5 h-5 rounded-full border-4 border-slate-800 ${theme === 'dark' ? 'bg-indigo-500 shadow-md ring-4 ring-indigo-500/40' : 'bg-slate-200'}`} />
                      </div>
                      <div className="bg-slate-800 h-24 rounded-xl border border-slate-700 relative z-10 overflow-hidden">
                        <div className="w-1/3 h-full bg-slate-900 border-r border-slate-700 p-2 space-y-2">
                          <div className="w-full h-2 bg-slate-800 rounded-full" />
                          <div className="w-2/3 h-2 bg-slate-800 rounded-full" />
                        </div>
                      </div>
                      <p className={`text-xs font-medium leading-relaxed relative z-10 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-400'}`}>Professional dark interface tailored for focus and reduced eye strain.</p>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                      <Volume2 size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-primary tracking-tight mb-1">Alert Notifications</h3>
                      <p className="text-sm font-medium text-secondary">Control how and when you're notified about workspace activity.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-8 bg-main rounded-[2rem] border border-base group/alert hover:border-indigo-500/30 transition-all">
                      <div className="max-w-md">
                        <p className="font-bold text-primary tracking-tight text-lg">Desktop Notifications</p>
                        <p className="text-sm text-secondary mt-2 leading-relaxed font-medium">Get real-time updates for task assignments and mentions even when WorkSphere is in the background.</p>
                      </div>
                      <button
                        onClick={() => handleAlertToggle("desktop")}
                        className={`w-14 h-7 rounded-full transition-all relative shadow-inner ${alerts.desktop ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${alerts.desktop ? 'left-8' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-8 bg-main rounded-[2rem] border border-base group/alert hover:border-indigo-500/30 transition-all">
                      <div className="max-w-md">
                        <p className="font-bold text-primary tracking-tight text-lg">Sound Notifications</p>
                        <p className="text-sm text-secondary mt-2 leading-relaxed font-medium">Plays a subtle chime when you receive a message or task update.</p>
                      </div>
                      <button
                        onClick={() => handleAlertToggle("sound")}
                        className={`w-14 h-7 rounded-full transition-all relative shadow-inner ${alerts.sound ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${alerts.sound ? 'left-8' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="pt-6">
                      <button
                        onClick={testNotification}
                        className="flex items-center gap-3 px-8 py-3.5 bg-main border border-base text-primary rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-card hover:shadow-lg transition-all active:scale-95"
                      >
                        <Volume2 size={16} />
                        Test Alert System
                      </button>
                    </div>
                  </div>
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