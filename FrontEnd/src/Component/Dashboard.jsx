import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TaskBoard from "./TaskBoard";
import Team from "./Team";
import SettingsComponent from "./Settings";
import Calendar from "./Calendar";
import Projects from "./Projects";
import NotificationsCenter from "./NotificationsCenter";
import Reports from "./Reports";
import {
  LayoutGrid,
  Folder,
  CheckSquare,
  Users,
  Settings,
  LogOut,
  Search,
  Bell,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Menu,
  ChevronRight,
  ChevronLeft,
  Share2,
  MoreHorizontal,
  Table as TableIcon,
  Layout,
  Trello,
  Activity,
  User,
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: "Guest",
    email: "",
    profilePhoto: "",
  });
  const [activeView, setActiveView] = useState("tasks"); // Default to tasks like in the reference
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [projects, setProjects] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

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
      await Promise.all([fetchProjects(), fetchUnreadCount()]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
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

  const NavItem = ({ id, label, Icon, badge }) => (
    <button
      onClick={() => setActiveView(id)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all group ${
        activeView === id 
          ? "bg-white shadow-sm text-slate-900 font-semibold border border-slate-200" 
          : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-900"
      }`}
    >
      <Icon size={18} className={`${activeView === id ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600"}`} />
      {sidebarOpen && <span className="text-sm flex-1 text-left">{label}</span>}
      {sidebarOpen && badge > 0 && (
        <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded">
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <div className="flex h-screen bg-white text-slate-900 font-sans overflow-hidden">
      {/* Sidebar - Dribbble Style */}
      <aside 
        className={`${sidebarOpen ? 'w-64' : 'w-20'} h-full bg-[#F3F4F6] border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out z-50`}
      >
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center shadow-md">
              <Trello className="text-white" size={18} />
            </div>
            {sidebarOpen && <span className="font-bold text-slate-800 tracking-tight">Kanban Team</span>}
          </div>
          {sidebarOpen && <ChevronLeft size={16} className="text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" />}
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar py-2">
          <NavItem id="dashboard" label="Overview" Icon={LayoutGrid} />
          <NavItem id="calendar" label="Calendar" Icon={CalendarIcon} />
          <NavItem id="tasks" label="Tasks" Icon={Layout} />
          <NavItem id="team" label="Team" Icon={Users} />
          <NavItem id="notifications" label="Notifications" Icon={Bell} badge={unreadCount} />
          <NavItem id="settings" label="Settings" Icon={Settings} />

          {sidebarOpen && (
            <div className="pt-8 pb-2">
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Projects</p>
              <div className="space-y-1">
                {projects.map((p) => (
                   <button 
                    key={p._id}
                    onClick={() => setActiveView("tasks")} // Simplified for now
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-500 hover:bg-slate-200/50 hover:text-slate-900 rounded-lg transition-all group lg:truncate"
                   >
                     <div className="w-2 h-2 rounded-full ring-2 ring-white" style={{ backgroundColor: p.color || '#6366f1' }} />
                     <span className="truncate">{p.name}</span>
                   </button>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-white shadow-sm">
                {user.profilePhoto ? (
                  <img src={`http://localhost:5000${user.profilePhoto}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={18} className="text-slate-500" />
                )}
             </div>
             {sidebarOpen && (
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-bold truncate text-slate-800">{user.name}</p>
                 <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
               </div>
             )}
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all text-sm font-medium"
          >
            <LogOut size={16} />
            {sidebarOpen && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#F9FAFB]">
        {/* Top Breadcrumb & Actions */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-slate-200 bg-white z-40">
           <div className="flex items-center gap-4 text-slate-400 text-sm font-medium">
              <div className="flex items-center gap-2">
                 <ChevronLeft size={16} />
                 <ChevronRight size={16} />
              </div>
              <span className="text-slate-300">/</span>
              <span>Projects</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900 font-bold shrink-0">MindMap AI</span>
           </div>

           <div className="flex items-center gap-4">
              <div className="flex -space-x-2 mr-2">
                 {[1,2,3].map(i => (
                   <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">U{i}</div>
                 ))}
                 <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">+</div>
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-900">
                 <Share2 size={18} />
              </button>
              <button className="p-2 text-slate-400 hover:text-slate-900">
                 <MoreHorizontal size={18} />
              </button>
              <div className="h-6 w-[1px] bg-slate-200 mx-1" />
              <button 
                onClick={() => setShowQuickAdd(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-sm transition-all shadow-sm active:scale-95"
              >
                <Plus size={18} />
                <span>New task</span>
              </button>
           </div>
        </header>

        {/* View Specific Header (Project Info) */}
        <div className="bg-white px-8 pt-8 pb-4">
           <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-6">MindMap AI</h1>
           <div className="flex items-center gap-8 border-b border-slate-100">
              <button className="flex items-center gap-2 px-1 pb-4 text-sm font-bold text-slate-900 border-b-2 border-slate-900 transition-all">
                 <Layout size={16} />
                 <span>Board</span>
              </button>
              <button className="flex items-center gap-2 px-1 pb-4 text-sm font-medium text-slate-400 hober:text-slate-900 transition-all">
                 <TableIcon size={16} />
                 <span>Table</span>
              </button>
              <button className="flex items-center gap-2 px-1 pb-4 text-sm font-medium text-slate-400 hover:text-slate-900 transition-all">
                 <Clock size={16} />
                 <span>Timeline</span>
              </button>
           </div>
        </div>

        {/* Scrollable View Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {activeView === "dashboard" && (
            <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2">
               {/* Simplified Overview Dashboard for now */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[
                   { label: "Completion Rate", value: "84%", color: "text-indigo-600", bg: "bg-indigo-50" },
                   { label: "Active Tasks", value: "12", color: "text-sky-600", bg: "bg-sky-50" },
                   { label: "Resolved", value: "24", color: "text-emerald-600", bg: "bg-emerald-50" },
                 ].map((stat, i) => (
                   <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                     <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                     <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {activeView === "projects" && <Projects />}
          {activeView === "tasks" && <TaskBoard />}
          {activeView === "calendar" && <Calendar />}
          {activeView === "notifications" && <NotificationsCenter />}
          {activeView === "reports" && <Reports />}
          {activeView === "team" && <Team />}
          {activeView === "settings" && <SettingsComponent />}
        </div>
      </main>

      {/* Simplified Quick Add Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowQuickAdd(false)}>
           <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl p-8 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-6 text-slate-900">Quick Task Creation</h2>
              <form className="space-y-4">
                 <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all" placeholder="What needs to be done?" />
                 <div className="flex gap-3 pt-2">
                    <button type="button" className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold transition-all text-sm" onClick={() => setShowQuickAdd(false)}>Cancel</button>
                    <button type="button" className="flex-[2] py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-sm transition-all shadow-md active:scale-95">Create Task</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
