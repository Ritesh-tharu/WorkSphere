import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  Filter,
  X,
  Calendar,
  Flag,
  Users,
  Folder,
  Tag,
  SortAsc,
  SortDesc,
  CheckSquare,
  ChevronDown,
  Layers,
  Zap,
} from "lucide-react";

const SearchFilters = ({ onSearchResults, initialFilters = {} }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: [],
    priority: [],
    project: "",
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
      if (filters.project) params.append("project", filters.project);
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
    if (filters.project) count++;
    if (filters.assignedTo) count++;
    if (filters.dueDate) count++;
    if (filters.tags.length > 0) count++;
    if (filters.isArchived) count++;
    return count;
  };

  return (
    <div className="relative w-full max-w-xl group">
       <div className="flex items-center gap-3">
          <div className="relative flex-1">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
             <input 
                className="w-full bg-white/5 border border-white/5 rounded-[1.25rem] pl-12 pr-12 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 transition-all font-medium"
                placeholder="Search across nodes…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
             />
             {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-all p-1">
                   <X size={14} />
                </button>
             )}
          </div>
          
          <button 
             onClick={() => setShowFilters(!showFilters)}
             className={`flex items-center gap-2.5 px-6 py-3 rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest transition-all border relative ${showFilters ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/10'}`}
          >
             <Filter size={16} />
             <span>Filter</span>
             {getActiveFilterCount() > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-slate-950">
                   {getActiveFilterCount()}
                </span>
             )}
          </button>
       </div>

       {showFilters && (
          <div className="absolute top-full left-0 right-0 mt-4 z-[60] animate-in slide-in-from-top-4 duration-300">
             <div className="glass-card rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-500/10 space-y-8 border-indigo-500/20">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                   <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                      <Layers className="text-indigo-400" size={18} /> Heuristic Filters
                   </h3>
                   <button onClick={() => toggleFilter('isArchived', !filters.isArchived)} className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-rose-400 transition-colors">Reset All</button>
                </div>

                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block px-1">Tactical Status</label>
                      <div className="flex flex-wrap gap-2">
                         {statusOptions.map(opt => (
                            <button 
                               key={opt.value}
                               onClick={() => toggleFilter('status', opt.value)}
                               className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${filters.status.includes(opt.value) ? 'bg-white/10 text-white border-white/20' : 'text-slate-500 border-transparent hover:bg-white/5'}`}
                            >
                               {opt.label}
                            </button>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block px-1">Priority Level</label>
                      <div className="flex flex-wrap gap-2">
                         {priorityOptions.map(opt => (
                            <button 
                               key={opt.value}
                               onClick={() => toggleFilter('priority', opt.value)}
                               className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${filters.priority.includes(opt.value) ? 'bg-white/10 text-white border-white/20' : 'text-slate-500 border-transparent hover:bg-white/5'}`}
                            >
                               {opt.label}
                            </button>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-3">
                      <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1">Project Hub</label>
                      <div className="relative">
                         <Folder className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                         <select 
                            value={filters.project}
                            onChange={e => setFilters({...filters, project: e.target.value})}
                            className="w-full bg-slate-950/50 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest appearance-none focus:ring-1 focus:ring-indigo-500/20"
                         >
                            <option value="">Global Search</option>
                            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                         </select>
                         <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={14} />
                      </div>
                   </div>

                   <div className="space-y-3">
                      <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1">Time Horizon</label>
                      <div className="relative">
                         <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                         <select 
                            value={filters.dueDate}
                            onChange={e => setFilters({...filters, dueDate: e.target.value})}
                            className="w-full bg-slate-950/50 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest appearance-none focus:ring-1 focus:ring-indigo-500/20"
                         >
                            <option value="">Any Time</option>
                            <option value="today">Now / Today</option>
                            <option value="this-week">Active Cycle</option>
                            <option value="overdue" className="text-rose-400 font-bold">Overdue Alert</option>
                         </select>
                         <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={14} />
                      </div>
                   </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                   <div className="flex items-center gap-4">
                      {loading && (
                         <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter italic">Syncing…</span>
                         </div>
                      )}
                   </div>
                   <button onClick={() => setShowFilters(false)} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Apply Heuristics</button>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

export default SearchFilters;
