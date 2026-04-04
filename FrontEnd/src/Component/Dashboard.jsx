import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TaskBoard from "./TaskBoard";
import Team from "./Team";
import SettingsComponent from "./Settings";
import Calendar from "./Calendar";
import ProjectManager from "./Project";
import NotificationsCenter from "./NotificationsCenter";
import Note from "./Note";
import {
  Layout,
  Users,
  Settings,
  ChevronDown,
  X,
  Plus,
  User,
  MoreHorizontal,
  LayoutGrid,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Edit2
} from "lucide-react";
import {
  FolderIcon,
  ChartBarSquareIcon,
  MagnifyingGlassIcon,
  BellIcon,
  PlusIcon,
  BoltIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  ShareIcon,
  ViewColumnsIcon,
  CalendarIcon,
  DocumentTextIcon,
  Bars3BottomLeftIcon,
  Bars3Icon,
  CommandLineIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";
import {
  FolderIcon as FolderIconSolid,
  ChartBarSquareIcon as ChartBarSquareIconSolid,
  BellIcon as BellIconSolid,
  PlusIcon as PlusIconSolid,
  BoltIcon as BoltIconSolid,
  CalendarIcon as CalendarIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  ViewColumnsIcon as ViewColumnsIconSolid
} from "@heroicons/react/24/solid";
import TaskModal from "./TaskModal";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: "Guest",
    email: "",
    profilePhoto: "",
  });
  const [activeView, setActiveView] = useState("dashboard"); // The Workspace Hub
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [projects, setProjects] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [recentTasks, setRecentTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [calendarKey, setCalendarKey] = useState(0);
  const [inviteEmail, setInviteEmail] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const actionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setShowActionsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    // Global Keyboard Shortcuts (CMD+K / CTRL+K for search)
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) searchInput.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  const token = localStorage.getItem("token");
  const [stats, setStats] = useState({
    activeTasks: 0,
    resolvedTasks: 0,
    completionRate: 0
  });

  const viewLabels = {
    dashboard: "Overview",
    tasks: "Task Board",
    calendar: "Calendar",
    boards: "Boards",
    team: "Team",
    notifications: "Notifications",
    notes: "Notes",
    settings: "Settings"
  };

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchDashboardInitialData();
  }, []);

  const fetchDashboardInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchProjects(),
        fetchRecentTasks(),
        fetchUnreadCount(),
        fetchUsers()
      ]);
    } catch (error) {
      console.error("Dashboard init error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/invitations/team", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/tasks/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats({
        activeTasks: res.data.totalActiveTasks || 0,
        resolvedTasks: res.data.totalCompletedTasks || 0,
        completionRate: res.data.totalCompletionRate || 0
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchRecentTasks = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/tasks/recent", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecentTasks(res.data);
    } catch (error) {
      console.error("Error fetching recent tasks:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(res.data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/notifications/unread-count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnreadCount(res.data.count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareTooltip(true);
    setTimeout(() => setShowShareTooltip(false), 2000);
  };


  const NavItem = ({ id, label, Icon, badge, onClick }) => (
    <button
      onClick={() => {
        setActiveView(id);
        if (id === "dashboard") setSelectedProjectId(null);
        if (onClick) onClick();
      }}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group ${
        activeView === id 
          ? "bg-indigo-600 shadow-lg shadow-indigo-600/20 text-white font-semibold border-transparent" 
          : "text-secondary hover:bg-indigo-50 dark:hover:bg-indigo-500/5 hover:text-indigo-600"
      }`}
    >
      <Icon className={`w-[18px] h-[18px] ${activeView === id ? "text-white" : "text-secondary group-hover:text-indigo-600 transition-colors"}`} />
      {sidebarOpen && <span className="text-sm flex-1 text-left tracking-tight">{label}</span>}
      {sidebarOpen && badge > 0 && (
        <span className={`${activeView === id ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"} text-[10px] font-bold px-1.5 py-0.5 rounded-md`}>
          {badge}
        </span>
      )}
    </button>
  );

  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [quickTaskProject, setQuickTaskProject] = useState("");

  useEffect(() => {
    if (showQuickAdd) {
      setQuickTaskProject(selectedProjectId || "");
    }
  }, [showQuickAdd, selectedProjectId]);

  const handleCreateQuickTask = async (e) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    try {
      await axios.post("http://localhost:5000/api/tasks", {
        title: quickTaskTitle,
        status: "todo",
        priority: "Medium",
        project: quickTaskProject || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuickTaskTitle("");
      setQuickTaskProject("");
      setShowQuickAdd(false);
      fetchStats();
      fetchProjects();
    } catch (error) {
      console.error("Error creating quick task:", error);
    }
  };

  return (
    <div className="flex h-screen bg-main text-primary font-sans overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${sidebarOpen ? 'w-64' : 'w-20'} h-full bg-sidebar border-r border-base flex flex-col transition-all duration-300 ease-in-out z-50`}
      >
        <div className={`p-6 flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'} mb-2 relative`}>
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => {
               setActiveView("dashboard");
               setSelectedProjectId(null);
               if (!sidebarOpen) setSidebarOpen(true);
            }}
          >
            <div className={`w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-all duration-500 ${!sidebarOpen ? 'group-hover:scale-110 group-hover:rotate-12' : 'group-hover:shadow-indigo-600/50'}`}>
              <BoltIconSolid className="text-white w-5 h-5" />
            </div>
            {sidebarOpen && (
               <div className="flex flex-col">
                  <span className="font-black text-xl text-primary tracking-tighter leading-none">WorkSphere</span>
                  <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-[0.2em] mt-0.5">Management</span>
               </div>
            )}
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className={`p-1.5 hover:bg-main rounded-lg text-secondary hover:text-primary transition-all duration-300 ${!sidebarOpen ? 'absolute -right-3 top-8 bg-card border border-base shadow-lg z-[60] scale-90 hover:scale-100' : ''}`}
            title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {sidebarOpen ? <Bars3BottomLeftIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar py-2">
          <NavItem id="dashboard" label="Overview" Icon={LayoutGrid} />
          <NavItem id="calendar" label="Calendar" Icon={CalendarIcon} />
          <NavItem id="boards" label="Boards" Icon={ViewColumnsIcon} />
          <NavItem id="team" label="Team" Icon={Users} />
          <NavItem id="notes" label="Notes" Icon={DocumentTextIcon} />
          <NavItem id="notifications" label="Notifications" Icon={BellIcon} badge={unreadCount} />
          <NavItem id="settings" label="Settings" Icon={Settings} />
        </nav>

        <div className="p-4 border-t border-base bg-sidebar/50">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-9 h-9 rounded-full bg-main flex items-center justify-center overflow-hidden border border-base shadow-sm">
                {user.profilePhoto ? (
                   <img src={`http://localhost:5000${user.profilePhoto}`} alt="" className="w-full h-full object-cover" />
                ) : (
                   <User className="text-secondary w-5 h-5" />
                )}
             </div>
             {sidebarOpen && (
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-bold truncate text-primary">{user.name}</p>
                 <p className="text-[10px] text-secondary truncate">{user.email}</p>
               </div>
             )}
          </div>
          <button 
            onClick={() => { localStorage.removeItem("token"); navigate("/login"); }} 
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            {sidebarOpen && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-main relative overflow-hidden">
         <header className="h-16 bg-card border-base border-b flex items-center justify-between px-8 z-40 sticky top-0">
            <div className="flex items-center gap-8 text-sm text-secondary font-medium">
               <div className="flex items-center gap-1.5">
                   <button onClick={() => window.history.back()} className="p-1 hover:bg-main rounded-md transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                   <button onClick={() => window.history.forward()} className="p-1 hover:bg-main rounded-md transition-colors"><ChevronRight className="w-4 h-4" /></button>
               </div>
               <div className="h-4 w-[1px] bg-base mx-1 hidden md:block" />
               <div className="hidden md:flex items-center gap-4">
                  <button onClick={() => { setActiveView("dashboard"); setSelectedProjectId(null); }} className="hover:text-primary transition-colors">Workspace</button>
                  <span className="text-secondary opacity-30">/</span>
                  <span className="text-primary font-black tracking-tight shrink-0">{viewLabels[activeView] || "Overview"}</span>
               </div>
            </div>

            {/* GLOBAL SEARCH BAR */}
            <div className="flex-1 max-w-xl mx-8 hidden lg:block">
               <div className="relative group">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-indigo-600 transition-colors w-4 h-4" />
                  <input 
                    id="global-search-input"
                    type="text" 
                    placeholder="Search tasks, projects, or team members..."
                    className="w-full bg-main border border-base rounded-2xl pl-12 pr-12 py-2 text-sm text-primary placeholder:text-secondary focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    onFocus={() => { if (activeView !== "boards" && activeView !== "tasks") setActiveView("boards"); }}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 bg-main border border-base rounded text-[10px] font-black text-secondary uppercase tracking-widest opacity-60 pointer-events-none group-focus-within:hidden">
                    <CommandLineIcon className="w-3 h-3" />
                    <span>K</span>
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-4">
               <button 
                 onClick={handleShare}
                 className="p-2 text-secondary hover:text-primary transition-colors relative"
                 title="Share workspace"
               >
                  <ShareIcon className="w-5 h-5" />
                  {showShareTooltip && (
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 dark:bg-indigo-600 text-white text-[10px] font-bold rounded shadow-xl animate-in fade-in zoom-in duration-200 z-[60] whitespace-nowrap">Link Copied!</div>
                  )}
               </button>

               <div className="relative" ref={actionsRef}>
                 <button onClick={() => setShowActionsDropdown(!showActionsDropdown)} className="p-2 text-secondary hover:text-primary transition-colors"><MoreHorizontal className="w-5 h-5" /></button>
                 {showActionsDropdown && (
                   <div className="absolute top-full mt-2 right-0 w-48 bg-card border border-base rounded-xl shadow-2xl py-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                     <button onClick={() => { setActiveView("settings"); setShowActionsDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-secondary hover:bg-main hover:text-primary flex items-center gap-2"><Settings className="w-4 h-4" /> Workspace Settings</button>
                   </div>
                 )}
               </div>

               <div className="h-6 w-[1px] bg-base mx-1" />
               <button onClick={() => setShowInviteModal(true)} className="hidden sm:flex items-center gap-2 px-4 py-2 text-indigo-500 hover:bg-indigo-500/10 border border-indigo-500/20 rounded-xl font-bold text-sm transition-all"><Users className="w-4 h-4" /><span>Invite</span></button>
               <button onClick={() => setShowQuickAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 hover:opacity-90"><Plus className="w-5 h-5" /><span>New task</span></button>
            </div>
         </header>

        <div className="flex-1 overflow-auto custom-scrollbar">
          {activeView === "dashboard" && (
            <div className="max-w-6xl mx-auto p-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-2">
                   <h1 className="text-4xl font-black text-primary tracking-tighter">
                     {(() => {
                       const hour = new Date().getHours();
                       if (hour < 12) return "Good morning";
                       if (hour < 18) return "Good afternoon";
                       return "Good evening";
                     })()}, {user.name.split(' ')[0]}!
                   </h1>
                   <p className="text-secondary text-sm font-bold opacity-60 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>

                {/* STAT COLUMNS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {[
                     { label: "Active Tasks", value: stats.activeTasks, color: "bg-indigo-600", Icon: ArrowTrendingUpIcon },
                     { label: "Resolved", value: stats.resolvedTasks, color: "bg-emerald-500", Icon: CheckCircle2 },
                     { label: "Completion Rate", value: `${stats.completionRate}%`, color: "bg-amber-500", Icon: ChartBarSquareIcon },
                   ].map((stat, i) => (
                     <div key={i} className="bg-card p-6 rounded-2xl border border-base shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 group-hover:scale-125 transition-transform duration-500" />
                        <div className="flex items-center gap-4 relative">
                           <div className={`p-3 rounded-xl ${stat.color} text-white shadow-lg`}><stat.Icon className="w-5 h-5" /></div>
                           <div>
                              <p className="text-[10px] font-black text-secondary tracking-[0.2em] uppercase mb-1">{stat.label}</p>
                              <p className="text-2xl font-black text-primary tracking-tighter">{stat.value}</p>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>

                {/* BOARD SHORTCUTS / RECENT ACTIVITY */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-4">
                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Recently Active</h2>
                         <button onClick={() => setActiveView("boards")} className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest">View all boards</button>
                      </div>
                      <div className="space-y-3">
                         {projects.slice(0, 3).map(p => (
                            <button 
                              key={p._id}
                              onClick={() => { setSelectedProjectId(p._id); setActiveView("boards"); }}
                              className="w-full flex items-center gap-4 p-4 bg-card border border-base rounded-2xl hover:bg-main transition-all group border-l-4"
                              style={{ borderLeftColor: p.color?.startsWith('#') ? p.color : '#6366f1' }}
                            >
                               <div className="w-12 h-12 rounded-xl bg-cover bg-center shrink-0 border border-white/20 shadow-sm" style={{ backgroundImage: p.color?.startsWith('http') ? `url(${p.color})` : 'none', backgroundColor: p.color?.startsWith('#') ? p.color : '#6366f1' }} />
                               <div className="text-left min-w-0">
                                  <p className="text-sm font-black text-primary uppercase tracking-tight truncate">{p.name}</p>
                                  <p className="text-[10px] text-secondary font-bold opacity-60">Board View</p>
                               </div>
                               <Plus className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-secondary w-4 h-4" />
                            </button>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-6">
                      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Global Activity Feed</h2>
                      <div className="space-y-4">
                         {recentTasks.length > 0 ? (
                           recentTasks.slice(0, 5).map(task => (
                             <div key={task._id} className="flex items-start gap-4 p-4 bg-card border border-base rounded-2xl">
                                <div className="mt-1 p-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded"><ArrowTrendingUpIcon className="w-4 h-4" /></div>
                                <div className="text-left">
                                   <p className="text-xs font-bold text-primary mb-1 underline hover:text-indigo-600 cursor-pointer" onClick={() => { setSelectedTask(task); setShowTaskModal(true); }}>{task.title}</p>
                                   <p className="text-[10px] text-secondary">Added to <span className="font-bold opacity-100">{projects.find(p => p._id === task.project)?.name || "Task Board"}</span></p>
                                </div>
                             </div>
                           ))
                         ) : (
                           <div className="py-12 border-2 border-dashed border-base rounded-2xl text-center opacity-40">
                              <p className="text-xs font-bold uppercase tracking-widest">No activity found</p>
                           </div>
                         )}
                      </div>
                   </div>
                </div>
            </div>
          )}

          {activeView === "boards" && (
             <div className="h-full flex flex-col min-h-0 bg-main">
                <ProjectManager initialSelectedId={selectedProjectId} globalSearch={globalSearch} />
             </div>
          )}

          {activeView === "tasks" && <TaskBoard selectedProjectId={null} />}
          {activeView === "calendar" && <Calendar key={calendarKey} onEventClick={(event) => { if (event.type === 'task') { setSelectedTask(event.task); setShowTaskModal(true); } }} />}
          {activeView === "notifications" && <NotificationsCenter />}
          {activeView === "team" && <Team />}
          {activeView === "notes" && <Note selectedProjectId={selectedProjectId} />}
          {activeView === "settings" && <SettingsComponent />}
          
          {showTaskModal && (
            <TaskModal
              task={selectedTask}
              onClose={() => { setShowTaskModal(false); setSelectedTask(null); }}
              onUpdate={() => { fetchRecentTasks(); fetchProjects(); fetchStats(); setCalendarKey(prev => prev + 1); }}
              users={users}
              projects={projects}
            />
          )}
        </div>
      </main>

      {/* Overlays (Quick Add, Invite) */}
      {showQuickAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowQuickAdd(false)}>
           <div className="bg-card w-full max-w-lg rounded-2xl border border-base shadow-2xl p-8 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-6 text-primary">Quick Task Creation</h2>
              <form onSubmit={handleCreateQuickTask} className="space-y-4">
                 <input className="w-full bg-main border border-base rounded-xl px-4 py-3 text-sm text-primary placeholder:text-slate-400 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all" placeholder="What needs to be done?" value={quickTaskTitle} onChange={(e) => setQuickTaskTitle(e.target.value)} required />
                 <div className="relative">
                   <select className="w-full bg-main border border-base rounded-xl px-4 py-3 text-sm text-primary appearance-none cursor-pointer outline-none transition-all font-medium" value={quickTaskProject} onChange={(e) => setQuickTaskProject(e.target.value)}>
                     <option value="">No Workspace (Global)</option>
                     {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                   </select>
                   <FolderIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none w-4 h-4" />
                 </div>
                 <div className="flex gap-3 pt-2">
                    <button type="button" className="flex-1 py-3 bg-main hover:bg-card text-secondary rounded-xl font-bold transition-all text-sm border border-base" onClick={() => setShowQuickAdd(false)}>Cancel</button>
                    <button type="submit" className="flex-[2] py-3 bg-slate-900 dark:bg-indigo-600 hover:opacity-90 text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95">Create Task</button>
                 </div>
              </form>
           </div>
        </div>
      )}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowInviteModal(false)}>
           <div className="bg-card w-full max-w-md rounded-2xl border border-base shadow-2xl p-8 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-primary">Invite Team Member</h2>
                <button onClick={() => setShowInviteModal(false)} className="text-secondary hover:text-primary transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await axios.post("http://localhost:5000/api/invitations/send", { email: inviteEmail }, { headers: { Authorization: `Bearer ${token}` } });
                  alert("Invitation sent successfully!");
                  setShowInviteModal(false);
                  setInviteEmail("");
                } catch (err) { alert(err.response?.data?.message || "Failed to send invitation"); }
              }} className="space-y-4">
                 <input type="email" className="w-full bg-main border border-base rounded-xl px-4 py-3 text-sm text-primary placeholder:text-slate-400 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all" placeholder="teammate@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
                 <button type="submit" className="w-full py-3 bg-slate-900 dark:bg-indigo-600 hover:opacity-90 text-white rounded-xl font-bold text-sm transition-all shadow-md">Send Invitation</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
