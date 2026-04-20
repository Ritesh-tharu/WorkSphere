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
    <div className="w-full bg-white border-b border-slate-100 px-8 py-4 space-y-4">
       {/* Primary Toolbar */}
       <div className="flex flex-wrap items-center gap-6">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md group/input">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-600 transition-colors" size={16} />
             <input 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-12 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold tracking-tight"
                placeholder="Search tasks…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
             />
             {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-all p-1">
                   <X size={14} />
                </button>
             )}
          </div>
          
          {/* Status Selectors */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-2xl">
              {statusOptions.map(opt => {
                 const isActive = filters.status.includes(opt.value);
                 return (
                   <button 
                      key={opt.value}
                      onClick={() => toggleFilter('status', opt.value)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 flex items-center gap-2 ${isActive ? 'bg-white text-indigo-600 border-white shadow-sm ring-1 ring-slate-200' : 'text-slate-500 border-transparent hover:text-slate-900'}`}
                   >
                      {opt.label}
                   </button>
                 );
              })}
          </div>

          {/* Priority Selectors */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm">
              {priorityOptions.map(opt => {
                 const isActive = filters.priority.includes(opt.value);
                 return (
                   <button 
                      key={opt.value}
                      onClick={() => toggleFilter('priority', opt.value)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 flex items-center gap-2 ${isActive ? 'bg-white text-indigo-600 border-white shadow-sm ring-1 ring-slate-200' : 'text-slate-500 border-transparent hover:text-slate-900'}`}
                   >
                      {opt.label}
                   </button>
                 );
              })}
          </div>

          {/* Clear Button */}
          {getActiveFilterCount() > 0 && (
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
               className="px-5 py-3 bg-rose-50 border border-rose-100 rounded-2xl text-[9px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-100 transition-all font-black"
             >
               Clear Filters
             </button>
          )}

          {loading && (
             <div className="flex items-center gap-2 ml-auto">
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Syncing Hub…</span>
             </div>
          )}
       </div>

       {/* Secondary Filters */}
       <div className="flex flex-wrap items-center gap-8 pl-1 pb-1">
          <div className="flex items-center gap-2 group/sel">
             <Folder className="text-slate-400 group-hover/sel:text-indigo-500 transition-colors" size={14} />
             <select 
                value={filters.project}
                onChange={e => setFilters({...filters, project: e.target.value})}
                className="bg-transparent text-[10px] font-black text-slate-500 uppercase tracking-widest outline-none cursor-pointer hover:text-slate-900 transition-colors"
             >
                <option value="all">Project Scope: All</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
             </select>
          </div>

          <div className="flex items-center gap-2 group/sel">
             <Users className="text-slate-400 group-hover/sel:text-indigo-500 transition-colors" size={14} />
             <select 
                value={filters.assignedTo}
                onChange={e => setFilters({...filters, assignedTo: e.target.value})}
                className="bg-transparent text-[10px] font-black text-slate-500 uppercase tracking-widest outline-none cursor-pointer hover:text-slate-900 transition-colors"
             >
                <option value="">Assignee: Everyone</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
             </select>
          </div>

          <div className="flex items-center gap-2 group/sel">
             <Calendar className="text-slate-400 group-hover/sel:text-indigo-500 transition-colors" size={14} />
             <select 
                value={filters.dueDate}
                onChange={e => setFilters({...filters, dueDate: e.target.value})}
                className="bg-transparent text-[10px] font-black text-slate-500 uppercase tracking-widest outline-none cursor-pointer hover:text-slate-900 transition-colors"
             >
                <option value="">Due Date: Any Time</option>
                <option value="today">Today</option>
                <option value="this-week">This Week</option>
                <option value="overdue">Overdue</option>
             </select>
          </div>
       </div>
    </div>
  );
};

export default SearchFilters;