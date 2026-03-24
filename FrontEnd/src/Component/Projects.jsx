import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Folder,
  Plus,
  MoreVertical,
  Users,
  Target,
  ChevronRight,
  X,
  Layout,
} from "lucide-react";

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    color: "#6366f1",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(res.data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5000/api/projects",
        newProject,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setProjects([res.data, ...projects]);
      setShowCreateModal(false);
      setNewProject({ name: "", description: "", color: "#6366f1" });
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">Projects</h1>
          <p className="text-sm font-medium text-slate-400">Manage and track all your active initiatives in one place.</p>
        </div>
        <button
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={18} />
          <span>New project</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4 opacity-40">
          <div className="w-10 h-10 border-4 border-slate-900 border-t-white rounded-full animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-800">Loading Workspaces…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-1">
          {projects.map((project) => (
            <div key={project._id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col h-full">
              <div 
                className="absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity" 
                style={{ backgroundColor: project.color }}
              />
              
              <div className="flex items-start justify-between mb-6">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm transition-transform group-hover:scale-110"
                  style={{ color: project.color, backgroundColor: `${project.color}10` }}
                >
                  <Folder size={24} />
                </div>
                <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                  <MoreHorizontal size={18} />
                </button>
              </div>

              <div className="mb-4 flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-2 truncate group-hover:text-black transition-colors">{project.name}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-2">
                  {project.description || "Building future-ready solutions and coordinating cross-functional team efforts."}
                </p>
              </div>

              <div className="flex items-center gap-6 mb-6 pt-4 border-t border-slate-50">
                 <div className="flex items-center gap-2">
                    <Users size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">{project.teamMembers?.length || 1} members</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <Target size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">{project.taskStats?.completed || 0} / {project.taskStats?.total || 0}</span>
                 </div>
              </div>

              <div className="space-y-3">
                 <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>Progress</span>
                    <span className="text-slate-900">{project.progress || 0}%</span>
                 </div>
                 <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-700" 
                      style={{ width: `${project.progress || 0}%`, backgroundColor: project.color }}
                    />
                 </div>
              </div>

              <button className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-200 transition-all font-bold text-xs uppercase tracking-widest group/btn">
                 <span>Explore Board</span>
                 <ChevronRight size={14} className="transition-transform group-hover/btn:translate-x-1" />
              </button>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="col-span-full py-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl opacity-40 text-center">
              <Folder size={48} className="text-slate-300 mb-4" />
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No projects launched yet</p>
            </div>
          )}
        </div>
      )}

      {/* Simplified Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl p-8 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
               <h2 className="text-xl font-bold text-slate-900 tracking-tight">Launch New Project</h2>
               <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={createProject} className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Project Name *</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all font-medium"
                  placeholder="E.g. Lunar Gateway v2.0…"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all font-medium min-h-[100px] resize-none"
                  placeholder="Define the primary mission goals…"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Color Identity</label>
                <div className="flex gap-2">
                  {["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#ec4899"].map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-4 transition-all ${newProject.color === color ? "border-slate-900 scale-110" : "border-white"}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewProject({ ...newProject, color })}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all text-sm" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="flex-[2] py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95">Create project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
