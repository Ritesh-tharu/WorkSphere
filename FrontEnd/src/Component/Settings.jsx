import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  User,
  Mail,
  Camera,
  ChevronRight,
  Fingerprint,
  Palette,
  Volume2,
  Save,
} from "lucide-react";

const Settings = () => {
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
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser({
        name: parsedUser.name || "",
        email: parsedUser.email || "",
        phoneNumber: parsedUser.phoneNumber || "",
        dateOfBirth: parsedUser.dateOfBirth || "",
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
    try {
      const formData = new FormData();
      Object.keys(user).forEach(key => formData.append(key, user[key]));
      if (photoFile) formData.append("profilePhoto", photoFile);
      const res = await axios.put("http://localhost:5000/api/auth/update-profile", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      localStorage.setItem("user", JSON.stringify(res.data));
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const TABS = [
    { id: "profile", label: "Profile", Icon: User },
    { id: "security", label: "Security", Icon: Fingerprint },
    { id: "appearance", label: "Appearance", Icon: Palette },
    { id: "notifications", label: "Alerts", Icon: Volume2 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="px-1">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">Account & Preferences</h1>
        <p className="text-sm font-medium text-slate-400">Manage your profile, security protocols, and workspace aesthetics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 px-1">
        <aside className="lg:col-span-1 space-y-1">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${activeTab === id ? 'bg-white shadow-sm text-slate-900 font-bold border border-slate-200' : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-900'}`}
            >
              <Icon size={18} className={activeTab === id ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600"} />
              <span className="text-sm flex-1 text-left">{label}</span>
              {activeTab === id && <ChevronRight size={14} className="text-slate-300" />}
            </button>
          ))}
        </aside>

        <div className="lg:col-span-3">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 md:p-10">
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
                      <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center justify-center cursor-pointer shadow-lg transition-all scale-100 hover:scale-110 active:scale-95 border-2 border-white">
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
                      <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all font-medium" value={user.name} onChange={e => setUser({...user, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Email Address</label>
                      <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all font-medium" value={user.email} onChange={e => setUser({...user, email: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Job Title</label>
                      <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all font-medium" value={user.jobTitle} onChange={e => setUser({...user, jobTitle: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Location</label>
                      <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all font-medium" value={user.location} onChange={e => setUser({...user, location: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Biography</label>
                    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all font-medium min-h-[120px] resize-none" value={user.bio} onChange={e => setUser({...user, bio: e.target.value})} />
                  </div>

                  <div className="flex pt-4">
                    <button type="submit" className="flex items-center gap-2 px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 disabled:opacity-50">
                       <Save size={16} />
                       {loading ? "Syncing…" : "Save Profile"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab !== "profile" && (
              <div className="py-20 text-center opacity-40 animate-in fade-in duration-300">
                <SettingsComponent.Icon size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-sm font-bold uppercase tracking-widest">Protocol configuration under maintenance</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
