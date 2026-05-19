import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, Crown, Sparkles, Trash2, Edit2, ShieldAlert, ShieldCheck, 
  Search, LayoutGrid, CheckCircle2, TrendingUp, LogOut, Calendar, 
  ChevronLeft, ChevronRight, X, AlertTriangle, ArrowUpDown, Shield
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  
  // Stats state
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    freeUsers: 0,
    totalProjects: 0,
    totalTasks: 0,
    conversionRate: 0
  });
  
  // Users list state
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterRole, setFilterRole] = useState("all");

  // Modal States
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    plan: "free",
    role: "admin",
    subscriptionExpires: ""
  });

  // Alerts state
  const [alert, setAlert] = useState({ type: "", message: "" });

  useEffect(() => {
    // Load admin info
    const adminData = localStorage.getItem("user");
    if (adminData) {
      setAdmin(JSON.parse(adminData));
    }
    fetchStats();
  }, []);

  useEffect(() => {
    // Reset to page 1 when search or filters change
    setPage(1);
  }, [search, filterPlan, filterRole]);

  useEffect(() => {
    fetchUsers();
  }, [page, search, filterPlan, filterRole]);

  // Alert handler
  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: "", message: "" }), 4000);
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await axiosInstance.get("/admin/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      triggerAlert("error", "Failed to retrieve statistics.");
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 8,
        search,
        plan: filterPlan,
        role: filterRole
      });
      const response = await axiosInstance.get(`/admin/users?${params.toString()}`);
      setUsers(response.data.users);
      setTotalPages(response.data.pages);
      setTotalUsersCount(response.data.totalUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      triggerAlert("error", "Failed to retrieve users list.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Open Edit Modal
  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditFormData({
      plan: user.plan || "free",
      role: user.role || "admin",
      subscriptionExpires: user.subscriptionExpires ? new Date(user.subscriptionExpires).toISOString().split('T')[0] : ""
    });
    setShowEditModal(true);
  };

  // Submit Edit Modal
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(`/admin/users/${selectedUser._id}`, editFormData);
      triggerAlert("success", `Successfully updated account details for ${selectedUser.name}`);
      setShowEditModal(false);
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error("Error updating user:", error);
      triggerAlert("error", error.response?.data?.message || "Failed to update user.");
    }
  };

  // Open Delete Modal
  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Confirm Delete User
  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/admin/users/${selectedUser._id}`);
      triggerAlert("success", `Successfully removed user ${selectedUser.name} from the system.`);
      setShowDeleteModal(false);
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error("Error deleting user:", error);
      triggerAlert("error", error.response?.data?.message || "Failed to delete user.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden">
      {/* Background Decorative Gradient */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[150px] pointer-events-none" />

      {/* ALERT TOAST */}
      {alert.message && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl border flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-4 duration-300 ${
          alert.type === "success" 
            ? "bg-emerald-950/90 border-emerald-800 text-emerald-400" 
            : "bg-rose-950/90 border-rose-800 text-rose-400"
        }`}>
          {alert.type === "success" ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
          <span className="text-xs font-semibold">{alert.message}</span>
        </div>
      )}

      {/* HEADER NAVBAR */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 border border-indigo-500/20">
              <ShieldCheck className="text-white" size={20} />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight uppercase leading-none block">WorkSphere</span>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.25em] mt-0.5 block">Console panel</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-black">
                {admin?.name ? admin.name[0].toUpperCase() : "A"}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold leading-tight">{admin?.name || "System Admin"}</p>
                <p className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase">admin</p>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-3.5 py-2 hover:bg-rose-950/30 text-rose-400 border border-transparent hover:border-rose-900/30 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10 z-10 relative">
        
        {/* WELCOME SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">System Dashboard</h1>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          
          <button 
            onClick={() => { fetchStats(); fetchUsers(); }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2 self-start md:self-auto"
          >
            Refresh Data
          </button>
        </div>

        {/* METRICS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          
          {/* Card 1: Total Users */}
          <div className="bg-slate-900/50 border border-slate-900 rounded-2xl p-5 hover:border-slate-800 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full -mr-4 -mt-4 group-hover:scale-125 transition-transform duration-500" />
            <div className="flex items-center gap-3 text-indigo-400 mb-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Users size={16} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Users</span>
            </div>
            <p className="text-2xl font-black tracking-tight text-white leading-none">
              {statsLoading ? "..." : stats.totalUsers}
            </p>
            <p className="text-[10px] text-slate-500 mt-2 font-semibold">Registered accounts</p>
          </div>

          {/* Card 2: Premium Users */}
          <div className="bg-slate-900/50 border border-slate-900 rounded-2xl p-5 hover:border-slate-800 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full -mr-4 -mt-4 group-hover:scale-125 transition-transform duration-500" />
            <div className="flex items-center gap-3 text-amber-500 mb-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Crown size={16} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Premium Users</span>
            </div>
            <p className="text-2xl font-black tracking-tight text-white leading-none">
              {statsLoading ? "..." : stats.premiumUsers}
            </p>
            <p className="text-[10px] text-slate-500 mt-2 font-semibold">Active subscriptions</p>
          </div>

          {/* Card 3: Free Users */}
          <div className="bg-slate-900/50 border border-slate-900 rounded-2xl p-5 hover:border-slate-800 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-slate-500/5 rounded-full -mr-4 -mt-4 group-hover:scale-125 transition-transform duration-500" />
            <div className="flex items-center gap-3 text-slate-400 mb-3">
              <div className="p-2 bg-slate-550/10 rounded-lg">
                <Sparkles size={16} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Free Users</span>
            </div>
            <p className="text-2xl font-black tracking-tight text-white leading-none">
              {statsLoading ? "..." : stats.freeUsers}
            </p>
            <p className="text-[10px] text-slate-500 mt-2 font-semibold">Standard features</p>
          </div>

          {/* Card 4: Total Projects */}
          <div className="bg-slate-900/50 border border-slate-900 rounded-2xl p-5 hover:border-slate-800 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-violet-500/5 rounded-full -mr-4 -mt-4 group-hover:scale-125 transition-transform duration-500" />
            <div className="flex items-center gap-3 text-violet-400 mb-3">
              <div className="p-2 bg-violet-500/10 rounded-lg">
                <LayoutGrid size={16} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Workspaces</span>
            </div>
            <p className="text-2xl font-black tracking-tight text-white leading-none">
              {statsLoading ? "..." : stats.totalProjects}
            </p>
            <p className="text-[10px] text-slate-500 mt-2 font-semibold">Active project boards</p>
          </div>

          {/* Card 5: Conversion Rate */}
          <div className="bg-slate-900/50 border border-slate-900 rounded-2xl p-5 hover:border-slate-800 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full -mr-4 -mt-4 group-hover:scale-125 transition-transform duration-500" />
            <div className="flex items-center gap-3 text-emerald-400 mb-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <TrendingUp size={16} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Conversion</span>
            </div>
            <p className="text-2xl font-black tracking-tight text-white leading-none font-sans">
              {statsLoading ? "..." : `${stats.conversionRate}%`}
            </p>
            <p className="text-[10px] text-slate-500 mt-2 font-semibold">Premium conversion rate</p>
          </div>

        </div>

        {/* METRICS PROGRESS & CHARTS */}
        {!statsLoading && (
          <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Premium vs Free Ratio</span>
              <span className="text-xs font-bold text-amber-500">{stats.premiumUsers} of {stats.totalUsers} Upgraded</span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-l-full shadow-lg"
                style={{ width: `${stats.conversionRate}%` }}
              />
              <div 
                className="h-full bg-slate-850"
                style={{ width: `${100 - stats.conversionRate}%` }}
              />
            </div>
            <div className="flex items-center gap-6 text-[10px] font-bold tracking-wider uppercase text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                <span>Premium ({stats.conversionRate}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-slate-700 rounded-full" />
                <span>Free ({(100 - stats.conversionRate).toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        )}

        {/* USERS DATA SECTION */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-[2rem] p-6 sm:p-8 space-y-6">
          
          {/* SEARCH & FILTERS CONTROLS */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative group w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors w-4 h-4" />
              <input 
                type="text"
                placeholder="Search users by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded-2xl pl-12 pr-4 py-3 text-xs text-white placeholder:text-slate-650 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
              
              {/* Filter Plan */}
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-900 rounded-2xl px-3 py-1.5 w-full sm:w-auto">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Plan</span>
                <select 
                  value={filterPlan} 
                  onChange={(e) => setFilterPlan(e.target.value)}
                  className="bg-transparent border-none text-xs text-white font-semibold outline-none py-1.5 pr-6 cursor-pointer"
                >
                  <option value="all">All Plans</option>
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              {/* Filter Role */}
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-900 rounded-2xl px-3 py-1.5 w-full sm:w-auto">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Role</span>
                <select 
                  value={filterRole} 
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="bg-transparent border-none text-xs text-white font-semibold outline-none py-1.5 pr-6 cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Workspace Admin</option>
                  <option value="member">Workspace Member</option>
                  <option value="admin">admin</option>
                </select>
              </div>

            </div>
          </div>

          {/* USERS TABLE */}
          <div className="border border-slate-900 bg-slate-900/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-900/60 text-slate-400 uppercase text-[9px] font-bold tracking-widest border-b border-slate-900">
                    <th className="py-4 px-6">User</th>
                    <th className="py-4 px-6">Email</th>
                    <th className="py-4 px-6">Joined Date</th>
                    <th className="py-4 px-6">Plan Status</th>
                    <th className="py-4 px-6">Role</th>
                    <th className="py-4 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-500 font-semibold uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-4 h-4 border-2 border-slate-700 border-t-indigo-400 rounded-full animate-spin" />
                          <span>Fetching user directory...</span>
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-500 font-semibold uppercase tracking-wider">
                        No matches found in the registry.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user._id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-4.5 px-6 font-bold text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black shrink-0">
                            {user.name[0].toUpperCase()}
                          </div>
                          <span className="truncate max-w-[150px]">{user.name}</span>
                        </td>
                        <td className="py-4.5 px-6 text-slate-400 font-medium">{user.email}</td>
                        <td className="py-4.5 px-6 text-slate-500 font-medium">
                          {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="py-4.5 px-6">
                          {user.plan === "premium" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full font-black text-[9px] uppercase tracking-wider">
                              <Crown size={10} />
                              Premium
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 text-slate-400 rounded-full font-bold text-[9px] uppercase tracking-wider">
                              Free
                            </span>
                          )}
                        </td>
                        <td className="py-4.5 px-6">
                          {user.role === "superadmin" ? (
                            <span className="inline-flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase">
                              <Shield size={10} />
                              admin
                            </span>
                          ) : user.role === "admin" ? (
                            <span className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase">
                              Workspace Admin
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase text-slate-500 font-semibold px-2 py-0.5">
                              Member
                            </span>
                          )}
                        </td>
                        <td className="py-4.5 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => openEditModal(user)}
                              className="p-2 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-400 border border-slate-900 hover:border-indigo-500/20 rounded-lg transition-all duration-300 cursor-pointer"
                              title="Edit User Plan/Role"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button 
                              onClick={() => openDeleteModal(user)}
                              disabled={user.role === "superadmin"}
                              className={`p-2 rounded-lg border transition-all duration-300 ${
                                user.role === "superadmin"
                                  ? "opacity-20 cursor-not-allowed border-transparent text-slate-700"
                                  : "hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border-slate-900 hover:border-rose-500/20 cursor-pointer"
                              }`}
                              title={user.role === "superadmin" ? "Cannot Delete Superadmin" : "Delete User"}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGINATION CONTROLS */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Showing page {page} of {totalPages} ({totalUsersCount} total users)
              </span>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="p-2 bg-slate-950 border border-slate-900 rounded-lg text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 transition-all cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button 
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      page === p 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15" 
                        : "bg-slate-950 border border-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button 
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="p-2 bg-slate-950 border border-slate-900 rounded-lg text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 transition-all cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 mt-20 text-center text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
        WorkSphere System Administrator Portal
      </footer>

      {/* EDIT MODAL */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-8 shadow-2xl relative animate-in zoom-in-95 duration-350 space-y-6">
            
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute right-6 top-6 p-1.5 hover:bg-slate-850 rounded-lg text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white tracking-tight">Edit user details</h3>
              <p className="text-xs text-slate-450 font-medium">Modify plan type and console privilege role for {selectedUser.name}.</p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-5">
              
              {/* Plan Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Plan Status</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setEditFormData({ ...editFormData, plan: "free" })}
                    className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                      editFormData.plan === "free" 
                        ? "bg-slate-950 border-slate-700 text-white shadow-inner" 
                        : "bg-slate-900 border-slate-850 text-slate-500 hover:text-slate-400"
                    }`}
                  >
                    Free Standard
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditFormData({ ...editFormData, plan: "premium" })}
                    className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      editFormData.plan === "premium" 
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-lg shadow-amber-500/5" 
                        : "bg-slate-900 border-slate-850 text-slate-500 hover:text-slate-400"
                    }`}
                  >
                    <Crown size={12} />
                    Premium VIP
                  </button>
                </div>
              </div>

              {/* Expiry date (only visible if plan is premium) */}
              {editFormData.plan === "premium" && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1.5">
                    <Calendar size={12} />
                    Subscription Expiration
                  </label>
                  <input 
                    type="date"
                    value={editFormData.subscriptionExpires}
                    onChange={(e) => setEditFormData({ ...editFormData, subscriptionExpires: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-650 focus:border-indigo-500 outline-none transition-all font-medium"
                  />
                  <p className="text-[10px] text-slate-500 leading-normal font-semibold">
                    Leave blank to automatically default subscription to exactly 30 days from today.
                  </p>
                </div>
              )}

              {/* Role Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">System Role</label>
                <select 
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  disabled={selectedUser.role === "admin"}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-650 focus:border-indigo-500 outline-none transition-all font-medium cursor-pointer"
                >
                  <option value="member">Workspace Member</option>
                  <option value="admin">Workspace Admin</option>
                  {selectedUser.role === "admin" && <option value="admin">admin</option>}
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 cursor-pointer text-center"
                >
                  Save changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-8 shadow-2xl relative animate-in zoom-in-95 duration-350 space-y-6">
            
            <button 
              onClick={() => setShowDeleteModal(false)}
              className="absolute right-6 top-6 p-1.5 hover:bg-slate-850 rounded-lg text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3.5 text-rose-500">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Delete User Account</h3>
                <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Critical system warning</p>
              </div>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed font-medium">
              Are you absolutely certain you want to permanently delete <strong className="text-white font-bold">{selectedUser.name}</strong> ({selectedUser.email})? 
              This operation will permanently delete all task assignments, notes, notification preferences, and team records relating to this user. <strong>This action cannot be undone.</strong>
            </p>

            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDeleteConfirm}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-rose-600/20 cursor-pointer text-center"
              >
                Confirm Delete
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
