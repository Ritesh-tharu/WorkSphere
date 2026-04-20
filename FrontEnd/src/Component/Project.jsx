import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Plus, 
  MoreHorizontal, 
  Users, 
  Layout, 
  CheckCircle2,
  X,
  Edit2,
  User,
  Settings,
  ChevronDown,
  LayoutGrid,
  Pencil
} from "lucide-react";
import { 
  ViewColumnsIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleIconSolidInner } from "@heroicons/react/24/solid";
import TaskBoard from "./TaskBoard";

/**
 * ProjectManager - High Fidelity Workspace Management
 * Switches between the Grid of Boards and the active Kanban Board.
 */
const ProjectManager = ({ initialSelectedId, globalSearch }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeBoardId, setActiveBoardId] = useState(initialSelectedId || null);
  const [activeSubTab, setActiveSubTab] = useState("boards"); // boards, members, settings
  const [activeMenuId, setActiveMenuId] = useState(null); // Track board context menu
  const [editingProject, setEditingProject] = useState(null); // Track board being edited
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    color: "#475569", // Slate as default
    visibility: "Workspace"
  });

  const token = localStorage.getItem("token");
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  const VISIBILITY_OPTIONS = [
    { id: 'Private', label: 'Private', description: 'Only board members can see and edit this board.' },
    { id: 'Workspace', label: 'Workspace', description: 'All members of the workspace can see and edit this board.' },
    { id: 'Public', label: 'Public', description: 'Anyone on the internet can see this board. Only board members can edit.' },
  ];

  const THEMES = [
    { type: 'color', name: "Slate", color: "#475569" },
    { type: 'color', name: "Indigo", color: "#6366f1" },
    { type: 'color', name: "Purple", color: "#a855f7" },
    { type: 'color', name: "Emerald", color: "#10b981" },
    { type: 'color', name: "Sky", color: "#0ea5e9" },
    { type: 'color', name: "Amber", color: "#f59e0b" },
    { type: 'color', name: "Rose", color: "#f43f5e" },
    { type: 'color', name: "Pink", color: "#ec4899" },
    { type: 'color', name: "Dark", color: "#1e293b" },
  ];

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    setActiveBoardId(initialSelectedId);
  }, [initialSelectedId]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/projects", headers);
      setProjects(res.data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;

    try {
      const submission = { 
        ...newProject, 
        color: newProject.color 
      };

      if (editingProject) {
        // UPDATE MODE
        const res = await axios.put(`http://localhost:5000/api/projects/${editingProject._id}`, submission, headers);
        setProjects(projects.map(p => p._id === editingProject._id ? res.data : p));
      } else {
        // CREATE MODE
        const res = await axios.post("http://localhost:5000/api/projects", submission, headers);
        setProjects([res.data, ...projects]);
        setActiveBoardId(res.data._id);
      }
      
      closeModal();
    } catch (error) {
      console.error("Error saving project:", error);
      if (error.response && error.response.status === 403 && error.response.data.isLimitReached) {
        if (window.confirm(error.response.data.message + " Would you like to upgrade to Premium?")) {
          // This component doesn't have navigate, I should probably pass it or use a redirect.
          // For now, I'll use window.location if navigate isn't available easily.
          window.location.href = "/pricing";
        }
      } else {
        alert(error.response?.data?.message || "Failed to save project");
      }
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure? This will permanently delete the board and all its tasks.")) return;
    try {
      await axios.delete(`http://localhost:5000/api/projects/${projectId}`, headers);
      setProjects(projects.filter(p => p._id !== projectId));
      setActiveMenuId(null);
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setNewProject({
      name: project.name,
      description: project.description || "",
      color: project.color?.startsWith('#') ? project.color : '#6366f1',
      visibility: project.visibility || "Workspace"
    });
    setShowCreateModal(true);
    setActiveMenuId(null);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingProject(null);
    setNewProject({ name: "", description: "", color: "#475569", visibility: "Workspace" });
  };

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes((globalSearch || "").toLowerCase())
  );

  if (activeBoardId) {
    return (
      <div className="h-full w-full bg-main overflow-hidden flex flex-col">
        <TaskBoard 
          key={activeBoardId} 
          selectedProjectId={activeBoardId} 
          onBack={() => setActiveBoardId(null)} 
          globalSearch={globalSearch}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-40 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl border border-slate-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 bg-main min-h-full p-8 lg:p-16 overflow-y-auto no-scrollbar animate-in fade-in duration-700 max-w-6xl mx-auto">
      
      {/* HIGH FIDELITY WORKSPACE HEADER */}
      <div className="flex items-center justify-between mb-12 pb-12 border-b border-base">
        <div className="flex items-start gap-8">
           <div className="space-y-4 pt-1">
              <div className="flex items-center gap-4">
                 <h1 className="text-4xl font-black text-primary tracking-tighter">Workspace</h1>
                 <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-secondary hover:text-primary border border-base">
                    <Pencil className="w-5 h-5" />
                 </button>
              </div>
               <div className="flex items-center gap-6 text-sm font-bold text-secondary uppercase tracking-widest opacity-60">
                  <span className="flex items-center gap-2"><LayoutGrid className="w-4 h-4" /> {filteredProjects.length} {filteredProjects.length === 1 ? 'board' : 'boards'}</span>
               </div>
           </div>
        </div>
      </div>

      {/* SUB NAVIGATION (TRELLO STYLE) */}
      <div className="flex items-center gap-2 mb-10 border-b border-base pb-1 overflow-x-auto no-scrollbar">
         {[
           { id: 'boards', label: 'Boards', Icon: ViewColumnsIcon },
           { id: 'members', label: 'Members', Icon: Users },
           { id: 'settings', label: 'Settings', Icon: Settings },
         ].map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveSubTab(tab.id)}
             className={`px-6 py-3 rounded-t-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 border-b-2 ${activeSubTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-secondary hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800'}`}
           >
             <tab.Icon className="w-4 h-4" />
             {tab.label}
           </button>
         ))}
      </div>

      {activeSubTab === 'boards' && (
        <div className="space-y-12">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-4 text-primary">
                <User className="w-6 h-6 text-indigo-500" />
                <h2 className="text-xl font-black tracking-tighter uppercase text-[12px] tracking-[0.25em]">Your boards</h2>
             </div>
             {globalSearch && (
               <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-lg animate-in slide-in-from-right-4">
                 <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Filtered by: "{globalSearch}"</span>
                 <button onClick={() => {
                   const searchInput = document.getElementById('global-search-input');
                   if (searchInput) {
                     // This is a bit hacky but works for a quick 'clear' trigger
                     const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                     nativeInputValueSetter.call(searchInput, "");
                     searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                   }
                 }} className="hover:text-indigo-600 transition-colors"><X className="w-3 h-3" /></button>
               </div>
             )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
             {filteredProjects.map((p) => (
               <div 
                 key={p._id} 
                 className="group cursor-pointer space-y-4 relative"
               >
                  <div 
                    onClick={() => setActiveBoardId(p._id)}
                    className="h-36 rounded-2xl shadow-xl transition-all group-hover:scale-[1.03] group-hover:-translate-y-1 relative overflow-hidden border border-base bg-cover bg-center"
                    style={{ 
                      backgroundColor: p.color?.startsWith('#') ? p.color : '#6366f1',
                      backgroundImage: p.color?.startsWith('http') ? `url(${p.color})` : 'none'
                    }}
                  >
                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                     <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                  </div>
                  <div className="px-1 flex items-center justify-between">
                     <h3 className="text-sm font-black text-primary tracking-tight truncate group-hover:text-indigo-600 transition-colors uppercase pr-2" onClick={() => setActiveBoardId(p._id)}>{p.name}</h3>
                     <button 
                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === p._id ? null : p._id); }}
                        className={`p-1.5 rounded-lg text-secondary hover:bg-slate-100 transition-all ${activeMenuId === p._id ? 'bg-slate-100 opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {/* CONTEXT MENU */}
                      {activeMenuId === p._id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />
                          <div className="absolute right-0 top-10 w-48 bg-white border border-base rounded-xl shadow-2xl z-50 py-2 animate-in zoom-in-95 duration-200">
                             <button onClick={() => openEditModal(p)} className="w-full text-left px-4 py-2 text-[11px] font-black text-slate-700 hover:bg-slate-50 uppercase tracking-widest flex items-center gap-3"><Pencil className="w-3.5 h-3.5" /> Edit Board</button>
                             <button onClick={() => handleDeleteProject(p._id)} className="w-full text-left px-4 py-2 text-[11px] font-black text-rose-500 hover:bg-rose-50 uppercase tracking-widest flex items-center gap-3 border-t border-base mt-2 pt-4"><X className="w-3.5 h-3.5" /> Delete Board</button>
                          </div>
                        </>
                      )}
                  </div>
               </div>
             ))}

             <button 
               onClick={() => setShowCreateModal(true)}
               className="h-36 bg-slate-100/50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3 text-secondary hover:text-indigo-600 transition-all group shadow-sm"
             >
               <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
               <span className="text-[14px] font-black tracking-tight">Create new board</span>
             </button>
          </div>
        </div>
      )}

      {activeSubTab === 'members' && (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
           <Users className="w-16 h-16 mb-6" />
           <h3 className="text-xl font-black uppercase tracking-[0.2em] mb-2">Members</h3>
           <p className="text-sm font-bold">Manage your workspace collaborators and permissions.</p>
        </div>
      )}

      {activeSubTab === 'settings' && (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
           <Settings className="w-16 h-16 mb-6" />
           <h3 className="text-xl font-black uppercase tracking-[0.2em] mb-2">Workspace Settings</h3>
           <p className="text-sm font-bold">Configure workspace identity, visibility and security tags.</p>
        </div>
      )}

      {/* HIGH-FIDELITY CREATION/EDIT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={closeModal}>
           <div className="bg-[#1d2125] text-white w-full max-w-sm rounded-xl border border-[#ffffff10] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              
              {/* LIVE PREVIEW SECTION */}
              <div 
                className="h-44 p-6 relative flex flex-col items-start bg-cover bg-center transition-all duration-700"
                style={{ 
                  backgroundColor: newProject.color,
                }}
              >
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="relative z-10 w-full flex justify-end">
                    <button onClick={closeModal} className="p-1 hover:bg-white/20 rounded text-white group"><X className="w-5 h-5 group-hover:rotate-90 transition-transform" /></button>
                  </div>
                  <div className="relative z-10 mt-auto bg-white/20 backdrop-blur-lg rounded px-3 py-1.5 border border-white/20 shadow-lg">
                    <div className="w-16 h-1.5 bg-white rounded-full mb-1" />
                    <div className="w-8 h-1 bg-white/40 rounded-full" />
                  </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Background</label>
                    <div className="grid grid-cols-4 gap-2">
                       {THEMES.map((t, i) => (
                         <button 
                           key={i}
                           type="button"
                            onClick={() => {
                               setNewProject({...newProject, color: t.color});
                            }}
                            className={`h-8 rounded-md transition-all relative overflow-hidden bg-center bg-cover ${ newProject.color === t.color ? 'ring-2 ring-indigo-500 scale-105 z-10 shadow-lg' : 'hover:scale-105 opacity-80 hover:opacity-100' }`}
                           style={{ 
                             backgroundColor: t.color,
                             backgroundImage: t.type === 'image' ? `url(${t.url})` : 'none'
                           }}
                         >
                           { newProject.color === t.color && (
                             <div className="absolute inset-0 flex items-center justify-center bg-black/10"><CheckCircleIconSolidInner className="w-4 h-4 text-white" /></div>
                           )}
                         </button>
                       ))}
                    </div>
                </div>

                <form onSubmit={handleSaveProject} className="space-y-5">
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Project Title <span className="text-rose-500">*</span></label>
                      <input 
                        autoFocus
                        className="w-full bg-[#22272b] border border-[#ffffff15] focus:border-indigo-500 rounded px-3 py-2.5 text-sm font-bold text-white outline-none transition-all placeholder:text-slate-500"
                        placeholder="Project title"
                        value={newProject.name}
                        onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                        required
                      />
                   </div>

                   <div className="relative">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Visibility</label>
                      <button 
                        type="button" 
                        onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
                        className="w-full flex items-center justify-between bg-[#22272b] border border-[#ffffff15] hover:bg-[#2c333a] rounded px-3 py-2.5 text-xs font-bold text-white transition-all text-left"
                      >
                        <span className="flex items-center gap-2 capitalize">
                           <ViewColumnsIcon className="w-4 h-4 text-slate-400" />
                           {newProject.visibility}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showVisibilityDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {showVisibilityDropdown && (
                        <>
                          <div className="fixed inset-0 z-[105]" onClick={() => setShowVisibilityDropdown(false)} />
                          <div className="absolute left-0 bottom-full mb-2 w-full bg-[#2c333a] border border-[#ffffff15] rounded-lg shadow-2xl z-[110] py-2 animate-in slide-in-from-bottom-2 duration-200">
                             {VISIBILITY_OPTIONS.map((opt) => (
                               <button
                                 key={opt.id}
                                 type="button"
                                 onClick={() => {
                                   setNewProject({ ...newProject, visibility: opt.id });
                                   setShowVisibilityDropdown(false);
                                 }}
                                 className={`w-full text-left px-4 py-3 hover:bg-[#384148] transition-all border-b border-[#ffffff05] last:border-0 ${newProject.visibility === opt.id ? 'bg-[#384148]' : ''}`}
                               >
                                 <div className="text-[11px] font-black uppercase tracking-widest text-white mb-0.5">{opt.label}</div>
                                 <div className="text-[9px] font-medium text-slate-400 leading-tight">{opt.description}</div>
                               </button>
                             ))}
                          </div>
                        </>
                      )}
                   </div>

                   <button 
                     type="submit" 
                     disabled={!newProject.name.trim()}
                     className="w-full py-3 mt-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#444] disabled:text-slate-500 text-white rounded font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.98]"
                   >
                     {editingProject ? 'Save Changes' : 'Create Board'}
                   </button>
                </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;