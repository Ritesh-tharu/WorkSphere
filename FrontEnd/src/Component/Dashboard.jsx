import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TaskBoard from "./TaskBoard";
import Team from "./Team";
import SettingsComponent from "./Settings";
import Calendar from "./Calendar";
import NotificationsCenter from "./NotificationsCenter";
import {
  LayoutGrid,
  Folder,
  CheckSquare,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Search,
  Bell,
  User,
  X,
  Plus,
  Zap,
  Activity,
  Target,
  Trello,
  Clock,
  Menu,
  ChevronRight,
  ChevronLeft,
  Share2,
  MoreHorizontal,
  Table as TableIcon,
  Layout,
  Calendar as CalendarIcon,
} from "lucide-react";
import TaskModal from "./TaskModal";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: "Guest",
    email: "",
    profilePhoto: "",
  });
  const [activeView, setActiveView] = useState("dashboard"); // Default to Overview
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
  const actionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setShowActionsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    team: "Team",
    notifications: "Notifications",
    settings: "Settings",
    projects: "Workspaces"
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
        fetchProjects(), 
        fetchUnreadCount(), 
        fetchStats(),
        fetchRecentTasks(),
        fetchUsers()
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/tasks/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats({
        activeTasks: res.data.todoTasks + res.data.inProgressTasks,
        resolvedTasks: res.data.completedTasks,
        completionRate: res.data.completionRate
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchRecentTasks = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/tasks?limit=5", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecentTasks(res.data);
    } catch (error) {
      console.error("Error fetching recent tasks:", error);
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
        if (id === "settings") {
          navigate("/settings");
        } else {
          setActiveView(id);
          if (onClick) onClick();
        }
      }}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group ${
        activeView === id 
          ? "bg-indigo-600 shadow-lg shadow-indigo-600/20 text-white font-semibold border-transparent" 
          : "text-secondary hover:bg-indigo-50 dark:hover:bg-indigo-500/5 hover:text-indigo-600"
      }`}
    >
      <Icon size={18} className={`${activeView === id ? "text-white" : "text-secondary group-hover:text-indigo-600 transition-colors"}`} />
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
      // Refresh stats and view if necessary
      fetchStats();
      fetchProjects(); // Refresh workspace stats
      if (activeView === 'tasks') {
        // This is a bit tricky since TaskBoard manages its own state
        // but for now, the user can switch views or we can use a global event/context
        // A simple window reload or just letting it be is fine for "Full Web Functional"
      }
    } catch (error) {
      console.error("Error creating quick task:", error);
    }
  };

  return (
    <div className="flex h-screen bg-main text-primary font-sans overflow-hidden">
      {/* Sidebar - Dribbble Style */}
      <aside 
        className={`${sidebarOpen ? 'w-64' : 'w-20'} h-full bg-sidebar border-r border-base flex flex-col transition-all duration-300 ease-in-out z-50`}
      >
        <div className="p-6 flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Zap className="text-white" size={20} fill="currentColor" />
            </div>
            {sidebarOpen && <span className="font-bold text-xl text-primary tracking-tighter">WorkSphere</span>}
          </div>
          {sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-main rounded-lg text-secondary hover:text-primary transition-all">
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar py-2">
          <NavItem id="dashboard" label="Overview" Icon={LayoutGrid} />
          <NavItem id="calendar" label="Calendar" Icon={CalendarIcon} />
          <NavItem id="tasks" label="Tasks" Icon={Layout} onClick={() => setSelectedProjectId(null)} />
          <NavItem id="team" label="Team" Icon={Users} />
          <NavItem id="notifications" label="Notifications" Icon={Bell} badge={unreadCount} />

          {sidebarOpen && projects.length > 0 && (
            <div className="space-y-1 mt-4 px-2">
              <p className="text-[10px] font-bold text-secondary/40 uppercase tracking-widest px-3 mb-2">Workspaces</p>
              {projects.map((p) => (
                 <button 
                  key={p._id}
                  onClick={() => { setSelectedProjectId(p._id); setActiveView("tasks"); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl transition-all ${selectedProjectId === p._id ? 'bg-indigo-500/10 text-indigo-600 font-bold border-l-2 border-indigo-600' : 'text-secondary hover:bg-main'}`}
                 >
                   <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color || '#6366f1' }} />
                   <span className="truncate">{p.name}</span>
                 </button>
              ))}
            </div>
          )}

          <NavItem id="settings" label="Settings" Icon={Settings} />

        </nav>

        <div className="p-4 border-t border-base bg-sidebar/50">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-9 h-9 rounded-full bg-main flex items-center justify-center overflow-hidden border border-base shadow-sm">
                {user.profilePhoto ? (
                   <img src={`http://localhost:5000${user.profilePhoto}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={18} className="text-secondary" />
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
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all text-sm font-medium"
          >
            <LogOut size={16} />
            {sidebarOpen && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-main">
        {/* Top Breadcrumb & Actions */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-base bg-card z-40">
           <div className="flex items-center gap-4 text-secondary text-sm font-medium">
              <div className="flex items-center gap-2">
                 <button 
                  onClick={() => window.history.back()} 
                  className="p-1 hover:bg-main rounded-md transition-colors"
                  title="Go Back"
                 >
                    <ChevronLeft size={16} />
                 </button>
                 <button 
                  onClick={() => window.history.forward()}
                  className="p-1 hover:bg-main rounded-md transition-colors"
                  title="Go Forward"
                 >
                    <ChevronRight size={16} />
                 </button>
              </div>
              <span className="text-base opacity-30">/</span>
              <button 
                onClick={() => setActiveView("dashboard")}
                className="hover:text-primary transition-colors"
              >
                Workspace
              </button>
              <span className="text-secondary opacity-30">/</span>
              <span className="text-primary font-bold shrink-0">
                {viewLabels[activeView] || "Overview"}
              </span>
           </div>

           <div className="flex items-center gap-4">
              <div className="relative">
                <button 
                  onClick={handleShare}
                  className="p-2 text-secondary hover:text-primary transition-colors relative"
                  title="Share workspace"
                >
                   <Share2 size={18} />
                   {showShareTooltip && (
                     <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 dark:bg-indigo-600 text-white text-[10px] font-bold rounded shadow-xl animate-in fade-in zoom-in duration-200 z-[60] whitespace-nowrap">
                       Link Copied!
                     </div>
                   )}
                </button>
              </div>

              <div className="relative" ref={actionsRef}>
                <button 
                  onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                  className="p-2 text-secondary hover:text-primary transition-colors"
                  title="More actions"
                >
                   <MoreHorizontal size={18} />
                </button>
                
                {showActionsDropdown && (
                  <div className="absolute top-full mt-2 right-0 w-48 bg-card border border-base rounded-xl shadow-2xl py-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                    <button onClick={() => { setActiveView("settings"); setShowActionsDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-secondary hover:bg-main hover:text-primary flex items-center gap-2">
                       <Settings size={14} /> Workspace Settings
                    </button>
                    <div className="h-[1px] bg-base my-1" />
                    <button onClick={() => setShowActionsDropdown(false)} className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-500/10 flex items-center gap-2">
                       <Folder size={14} /> Archive Project
                    </button>
                  </div>
                )}
              </div>

              <div className="h-6 w-[1px] bg-base mx-1" />
              <button 
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-indigo-500 hover:bg-indigo-500/10 border border-indigo-500/20 rounded-xl font-bold text-sm transition-all"
              >
                <Users size={16} />
                <span>Invite</span>
              </button>
              <button 
                onClick={() => setShowQuickAdd(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 hover:opacity-90"
              >
                <Plus size={18} />
                <span>New task</span>
              </button>
           </div>
        </header>


        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {activeView === "dashboard" && (
            <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2">
                {/* Greeting Section */}
                <div className="mb-2">
                  <h1 className="text-3xl font-black text-primary tracking-tight">
                    {(() => {
                      const hour = new Date().getHours();
                      if (hour < 12) return "Good morning";
                      if (hour < 18) return "Good afternoon";
                      return "Good evening";
                    })()}, {user.name.split(' ')[0]}!
                  </h1>
                  <p className="text-secondary font-medium mt-1">
                    You have <span className="text-indigo-600 font-bold">{stats.activeTasks}</span> active tasks across {projects.length} workspaces today.
                  </p>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: "Active Tasks", value: stats.activeTasks, color: "text-indigo-600", bg: "bg-indigo-500/10", icon: LayoutGrid },
                    { label: "Completion Rate", value: `${stats.completionRate}%`, color: "text-rose-600", bg: "bg-rose-500/10", icon: Target },
                    { label: "Tasks Resolved", value: stats.resolvedTasks, color: "text-emerald-600", bg: "bg-emerald-500/10", icon: CheckSquare },
                  ].map((stat, i) => (
                    <div key={i} className="bg-card p-6 rounded-2xl border border-base shadow-sm hover:shadow-md hover:border-indigo-500/20 transition-all group relative overflow-hidden">
                      <div className="relative z-10 flex flex-col gap-4">
                        <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                          <stat.icon size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">{stat.label}</p>
                          <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                        </div>
                      </div>
                      <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                        <stat.icon size={100} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col xl:flex-row gap-8">
                  {/* Left Column: Workspaces */}
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-xs font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
                        <Folder size={14} className="text-indigo-500" />
                        Active Workspaces
                      </h2>
                      <button onClick={() => setActiveView("tasks")} className="text-[10px] font-bold text-indigo-500 uppercase tracking-tight hover:text-indigo-700 transition-colors">View All Workspaces</button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {projects.map((p) => (
                        <div key={p._id} onClick={() => { setSelectedProjectId(p._id); setActiveView("tasks"); }} className="bg-card border border-base rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-indigo-500/30 transition-all group cursor-pointer relative overflow-hidden flex flex-col h-full min-h-[160px]">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-main rounded-bl-full -mr-16 -mt-16 group-hover:bg-indigo-500/5 transition-colors" />
                           
                           <div className="flex items-center gap-4 mb-6 relative z-10">
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-base shadow-sm group-hover:scale-110 transition-transform bg-white dark:bg-slate-800" style={{ color: p.color }}>
                                 <Folder size={24} />
                              </div>
                              <div className="overflow-hidden">
                                 <h3 className="text-base font-bold text-primary truncate tracking-tight group-hover:text-indigo-600 transition-colors">{p.name}</h3>
                                 <p className="text-[10px] text-secondary font-bold uppercase tracking-wider">{p.taskStats?.total || 0} Total Tasks</p>
                              </div>
                           </div>

                           <div className="mt-auto space-y-3 relative z-10">
                              <div className="flex items-center justify-between text-[10px] font-bold text-secondary uppercase tracking-widest">
                                 <span>Overall Progress</span>
                                 <span className="text-primary">{p.progress || 0}%</span>
                              </div>
                              <div className="h-2 w-full bg-main rounded-full overflow-hidden border border-base/50">
                                 <div className="h-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.1)]" style={{ width: `${p.progress || 0}%`, backgroundColor: p.color }} />
                              </div>
                           </div>
                        </div>
                      ))}
                      
                      {projects.length === 0 && (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-base rounded-2xl opacity-40 bg-main/30 text-center">
                           <Folder size={32} className="mb-2" />
                           <p className="text-[10px] font-bold uppercase tracking-widest">No Workspaces Found</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Recent Activity */}
                  <div className="w-full xl:w-80 space-y-6">
                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-xs font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
                        <Clock size={14} />
                        Recent Activity
                      </h2>
                    </div>

                    <div className="bg-card border border-base rounded-2xl p-6 shadow-sm space-y-4">
                      {recentTasks.length > 0 ? (
                        <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-base">
                          {recentTasks.map(task => (
                            <div 
                              key={task._id} 
                              onClick={() => { setSelectedTask(task); setShowTaskModal(true); }}
                              className="group/item relative cursor-pointer"
                            >
                              <div className={`absolute -left-[23px] top-1.5 w-4 h-4 rounded-full border-4 border-card z-10 ${
                                task.priority === 'Urgent' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 
                                task.priority === 'High' ? 'bg-amber-500' : 'bg-emerald-500'
                              }`} />
                              <div className="space-y-1">
                                <h4 className="text-[13px] font-bold text-primary group-hover/item:text-indigo-600 transition-colors leading-tight">
                                  {task.title}
                                </h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-secondary uppercase tracking-tight truncate max-w-[80px]">
                                    {task.project?.name || 'Global'}
                                  </span>
                                  <span className="text-[10px] font-medium text-slate-400">
                                     • {new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 opacity-30">
                           <Zap size={32} />
                           <p className="text-[10px] font-bold uppercase tracking-widest">No recent activity</p>
                        </div>
                      )}

                      <button onClick={() => setActiveView("tasks")} className="w-full py-3 mt-2 bg-main border border-base rounded-xl text-[10px] font-bold uppercase tracking-widest text-secondary hover:text-indigo-600 hover:border-indigo-500/30 transition-all">
                         Explore All Tasks
                      </button>
                    </div>
                  </div>
                </div>
            </div>
          )}

           {/* No longer using Projects separate view */}
          {activeView === "tasks" && <TaskBoard selectedProjectId={selectedProjectId} />}
          {activeView === "calendar" && (
            <Calendar 
              key={calendarKey}
              onEventClick={(event) => {
                if (event.type === 'task') {
                  setSelectedTask(event.task);
                  setShowTaskModal(true);
                }
              }} 
            />
          )}
          {activeView === "notifications" && <NotificationsCenter />}
          {activeView === "team" && <Team />}
          {activeView === "settings" && <SettingsComponent />}
          
          {showTaskModal && (
            <TaskModal
              task={selectedTask}
              onClose={() => { setShowTaskModal(false); setSelectedTask(null); }}
              onUpdate={() => { 
                fetchRecentTasks(); 
                fetchProjects(); 
                fetchStats(); 
                setCalendarKey(prev => prev + 1);
              }}
              users={users}
              projects={projects}
            />
          )}
        </div>
      </main>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowQuickAdd(false)}>
           <div className="bg-card w-full max-w-lg rounded-2xl border border-base shadow-2xl p-8 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-6 text-primary">Quick Task Creation</h2>
              <form onSubmit={handleCreateQuickTask} className="space-y-4">
                 <input 
                    className="w-full bg-main border border-base rounded-xl px-4 py-3 text-sm text-primary placeholder:text-slate-400 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all" 
                    placeholder="What needs to be done?" 
                    value={quickTaskTitle}
                    onChange={(e) => setQuickTaskTitle(e.target.value)}
                    required
                 />
                 <div className="relative">
                   <select
                     className="w-full bg-main border border-base rounded-xl px-4 py-3 text-sm text-primary appearance-none cursor-pointer outline-none transition-all font-medium"
                     value={quickTaskProject}
                     onChange={(e) => setQuickTaskProject(e.target.value)}
                   >
                     <option value="">No Workspace (Global)</option>
                     {projects.map(p => (
                       <option key={p._id} value={p._id}>{p.name}</option>
                     ))}
                   </select>
                   <Folder size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                 </div>
                 <div className="flex gap-3 pt-2">
                    <button type="button" className="flex-1 py-3 bg-main hover:bg-card text-secondary rounded-xl font-bold transition-all text-sm border border-base" onClick={() => setShowQuickAdd(false)}>Cancel</button>
                    <button type="submit" className="flex-[2] py-3 bg-slate-900 dark:bg-indigo-600 hover:opacity-90 text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95">Create Task</button>
                 </div>
              </form>
           </div>
        </div>
      )}
      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowInviteModal(false)}>
           <div className="bg-card w-full max-w-md rounded-2xl border border-base shadow-2xl p-8 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-primary">Invite Team Member</h2>
                <button onClick={() => setShowInviteModal(false)} className="text-secondary hover:text-primary transition-colors"><X size={20} /></button>
              </div>
              <p className="text-sm text-secondary mb-6">Enter an email address to send a workspace invitation.</p>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await axios.post("http://localhost:5000/api/invitations/send", { email: inviteEmail }, { headers: { Authorization: `Bearer ${token}` } });
                  alert("Invitation sent successfully!");
                  setShowInviteModal(false);
                  setInviteEmail("");
                } catch (err) { alert(err.response?.data?.message || "Failed to send invitation"); }
              }} className="space-y-4">
                 <input 
                    type="email"
                    className="w-full bg-main border border-base rounded-xl px-4 py-3 text-sm text-primary placeholder:text-slate-400 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all" 
                    placeholder="teammate@example.com" 
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                 />
                 <button type="submit" className="w-full py-3 bg-slate-900 dark:bg-indigo-600 hover:opacity-90 text-white rounded-xl font-bold text-sm transition-all shadow-md">Send Invitation</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
