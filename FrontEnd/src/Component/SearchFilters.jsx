import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  Filter,
  X,
  Calendar,
  Users,
  Folder,
  ChevronDown,
  Layers
} from "lucide-react";

const SearchFilters = ({ onSearchResults, initialFilters = {}, globalSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: [],
    priority: [],
    project: initialFilters.project || "all",
    assignedTo: "",
    dueDate: "",
    tags: [],
    isArchived: false,
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const statusOptions = [
    { value: "todo", label: "To Do", color: "#f59e0b" },
    { value: "doing", label: "Doing", color: "#6366f1" },
    { value: "completed", label: "Completed", color: "#10b981" },
  ];

  const priorityOptions = [
    { value: "Low", label: "Low", color: "#10b981" },
    { value: "Medium", label: "Medium", color: "#f59e0b" },
    { value: "High", label: "High", color: "#ef4444" },
    { value: "Urgent", label: "Urgent", color: "#8b5cf6" },
  ];

  useEffect(() => {
    fetchProjects();
    fetchUsers();
    fetchTags();
  }, []);

  useEffect(() => {
    if (initialFilters.project && filters.project !== initialFilters.project) {
        setFilters(prev => ({ ...prev, project: initialFilters.project }));
    }
  }, [initialFilters.project]);

  // Remove automatic sync from global search to avoid side effects on the board when searching from other views
  // useEffect(() => {
  //   if (globalSearch !== undefined) {
  //     setSearchTerm(globalSearch);
  //   }
  // }, [globalSearch]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => performSearch(), 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, filters, sortBy, sortOrder]);

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

  const fetchTags = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/tasks/tags", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTags(res.data);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (filters.status.length > 0) params.append("status", filters.status.join(","));
      if (filters.priority.length > 0) params.append("priority", filters.priority.join(","));
      if (filters.project && filters.project !== "all") params.append("project", filters.project);
      if (filters.project === "all") params.append("project", "all");
      if (filters.assignedTo) params.append("assignedTo", filters.assignedTo);
      if (filters.dueDate) params.append("dueDate", filters.dueDate);
      if (filters.tags.length > 0) params.append("tags", filters.tags.join(","));
      if (filters.isArchived) params.append("archived", "true");
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);

      const res = await axios.get(`http://localhost:5000/api/tasks/search?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onSearchResults(res.data);
    } catch (error) {
      console.error("Error searching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (type, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value) ? prev[type].filter(v => v !== value) : [...prev[type], value],
    }));
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status.length > 0) count++;
    if (filters.priority.length > 0) count++;
    if (filters.project && filters.project !== "all") count++;
    if (filters.assignedTo) count++;
    if (filters.dueDate) count++;
    if (filters.tags.length > 0) count++;
    if (filters.isArchived) count++;
    return count;
  };

  return (
    <div className="relative w-full max-w-xl group">
       <div className="flex items-center gap-4">
          <div className="relative flex-1 group/input">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within/input:text-indigo-500 transition-colors" size={16} />
             <input 
                className="w-full bg-card/40 backdrop-blur-md border border-base rounded-2xl pl-12 pr-12 py-2.5 text-xs text-primary placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 transition-all font-bold tracking-tight shadow-sm"
                placeholder="Search tasks by name or description…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
             />
             {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-all p-1">
                   <X size={14} />
                </button>
             )}
          </div>
          
          <button 
             onClick={() => setShowFilters(!showFilters)}
             className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all border relative shadow-sm active:scale-95 ${showFilters ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/20' : 'bg-card/40 text-secondary border-base hover:border-indigo-500/20'}`}
          >
             <Filter size={14} />
             <span>Filters</span>
             {getActiveFilterCount() > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center text-[9px] font-black border-2 border-white shadow-lg">
                   {getActiveFilterCount()}
                </span>
             )}
          </button>
       </div>

       {showFilters && (
          <div className="absolute top-full left-0 right-0 mt-4 z-[60] animate-in slide-in-from-top-4 zoom-in-95 duration-300">
             <div className="bg-card/90 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl border border-indigo-500/20 space-y-10">
                <div className="flex items-center justify-between border-b border-base pb-6">
                   <div className="space-y-1">
                     <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                        <Layers className="text-indigo-500" size={18} /> Advanced Filters
                     </h3>
                     <p className="text-[10px] font-bold text-secondary uppercase tracking-widest opacity-60">Fine-tune your results</p>
                   </div>
                   <button 
                    onClick={() => setFilters({
                      status: [],
                      priority: [],
                      project: "all",
                      assignedTo: "",
                      dueDate: "",
                      tags: [],
                      isArchived: false,
                    })} 
                    className="px-4 py-2 bg-main border border-base rounded-xl text-[9px] font-black text-secondary uppercase tracking-widest hover:text-rose-500 hover:border-rose-500/20 transition-all"
                   >
                     Clear All
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-5">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] block px-1">Task Status</label>
                      <div className="flex flex-wrap gap-2.5">
                         {statusOptions.map(opt => (
                            <button 
                               key={opt.value}
                               onClick={() => toggleFilter('status', opt.value)}
                               className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 flex items-center gap-2 ${filters.status.includes(opt.value) ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20' : 'bg-main text-secondary border-base hover:border-indigo-500/20'}`}
                            >
                               {filters.status.includes(opt.value) && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                               {opt.label}
                            </button>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-5">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] block px-1">Priority</label>
                      <div className="flex flex-wrap gap-2.5">
                         {priorityOptions.map(opt => (
                            <button 
                               key={opt.value}
                               onClick={() => toggleFilter('priority', opt.value)}
                               className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 flex items-center gap-2 ${filters.priority.includes(opt.value) ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20' : 'bg-main text-secondary border-base hover:border-indigo-500/20'}`}
                            >
                               {filters.priority.includes(opt.value) && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                               {opt.label}
                            </button>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] px-1">Project Scope</label>
                      <div className="relative group/sel">
                         <Folder className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/sel:text-indigo-500 transition-colors" size={14} />
                         <select 
                            value={filters.project}
                            onChange={e => setFilters({...filters, project: e.target.value})}
                            className="w-full bg-main border border-base rounded-2xl pl-10 pr-4 py-3 text-[11px] font-bold text-primary uppercase tracking-widest appearance-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 outline-none transition-all"
                         >
                            <option value="all">All Projects</option>
                            <option value="null">Shared Workspace (Global)</option>
                            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                         </select>
                         <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] px-1">Due Date</label>
                      <div className="relative group/sel">
                         <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/sel:text-indigo-500 transition-colors" size={14} />
                         <select 
                            value={filters.dueDate}
                            onChange={e => setFilters({...filters, dueDate: e.target.value})}
                            className="w-full bg-main border border-base rounded-2xl pl-10 pr-4 py-3 text-[11px] font-bold text-primary uppercase tracking-widest appearance-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 outline-none transition-all"
                         >
                            <option value="">Any Time</option>
                            <option value="today">Today</option>
                            <option value="this-week">This Week</option>
                            <option value="overdue">Overdue</option>
                         </select>
                         <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] px-1">Assignee</label>
                      <div className="relative group/sel">
                         <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/sel:text-indigo-500 transition-colors" size={14} />
                         <select 
                            value={filters.assignedTo}
                            onChange={e => setFilters({...filters, assignedTo: e.target.value})}
                            className="w-full bg-main border border-base rounded-2xl pl-10 pr-4 py-3 text-[11px] font-bold text-primary uppercase tracking-widest appearance-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 outline-none transition-all"
                         >
                            <option value="">Everyone</option>
                            {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                         </select>
                         <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                      </div>
                   </div>
                </div>

                <div className="flex items-center justify-between pt-8 border-t border-base">
                   <div className="flex items-center gap-6">
                      {loading && (
                         <div className="flex items-center gap-3">
                            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-[10px] font-black text-secondary uppercase tracking-widest italic animate-pulse">Syncing Hub…</span>
                         </div>
                      )}
                      {!loading && getActiveFilterCount() > 0 && (
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Applying {getActiveFilterCount()} active filters</p>
                      )}
                   </div>
                   <button 
                    onClick={() => {
                       performSearch();
                       setShowFilters(false);
                    }} 
                    type="button"
                    className="px-10 py-3.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center gap-3"
                   >
                    {loading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    Apply Filters
                   </button>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

export default SearchFilters;
