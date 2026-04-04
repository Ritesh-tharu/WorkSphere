import React, { useState } from "react";
import axios from "axios";
import {
  X,
  Plus,
  CheckCircle2,
  User,
  Settings,
  ChevronDown,
  LayoutGrid,
  MoreHorizontal,
  Clock,
  Send,
  MessageSquare,
  Calendar,
  List,
  Tag,
  Paperclip,
  Trash2,
  Folder,
  RotateCw,
  BarChart2
} from "lucide-react";
import { 
  CheckCircleIcon as CheckCircleIconSolidInner,
  ArrowDownOnSquareIcon as SaveIcon
} from "@heroicons/react/24/solid";
import TaskAttachments from "./TaskAttachments";

const PRIORITY_CONFIG = {
  Low: { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  Medium: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
  High: { color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
  Urgent: { color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
};

const STATUS_CONFIG = {
  todo: { label: "To-do", color: "text-slate-500", bg: "bg-slate-50" },
  doing: { label: "In progress", color: "text-amber-600", bg: "bg-amber-50" },
  completed: { label: "Done", color: "text-emerald-600", bg: "bg-emerald-50" },
};

const TABS = [
  { id: "details", label: "Details", Icon: List },
  { id: "checklist", label: "Checklist", Icon: CheckCircle2 },
  { id: "comments", label: "Comments", Icon: MessageSquare },
  { id: "activity", label: "Activity", Icon: RotateCw },
];

const LABEL_COLORS = [
  { name: "Emerald", color: "#4bce97" },
  { name: "Yellow", color: "#f5cd47" },
  { name: "Orange", color: "#fea362" },
  { name: "Red", color: "#f87168" },
  { name: "Purple", color: "#9f8fef" },
  { name: "Blue", color: "#579dff" },
  { name: "Sky", color: "#6cc3e0" },
  { name: "Lime", color: "#94c748" },
  { name: "Pink", color: "#e774bb" },
  { name: "Slate", color: "#8590a2" },
];

export default function TaskModal({ task, onClose, onUpdate, users = [], projects = [] }) {
  const [editedTask, setEditedTask] = useState(task);
  const [newComment, setNewComment] = useState("");
  const [newCheckItem, setNewCheckItem] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  const base = "http://localhost:5000/api/tasks";

  const patch = (fields) => setEditedTask((prev) => ({ ...prev, ...fields }));

  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Sanitize payload: only send simple fields to avoid 500 error from populated sub-objects
      const payload = {
        title: editedTask.title,
        description: editedTask.description,
        status: editedTask.status || "todo",
        priority: editedTask.priority || "Medium",
        dueDate: editedTask.dueDate,
        assignedTo: typeof editedTask.assignedTo === 'object' ? editedTask.assignedTo?._id : editedTask.assignedTo,
        project: typeof editedTask.project === 'object' ? editedTask.project?._id : editedTask.project,
        labels: editedTask.labels || [],
      };

      let res;
      if (task?._id) {
        // Update existing task
        res = await axios.put(`${base}/${task._id}`, payload, getHeaders());
      } else {
        // Create new task
        res = await axios.post(base, payload, getHeaders());
      }

      const { data } = res;
      if (onUpdate) onUpdate(data);
      setSaved(true);
      
      // Close modal after success
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 800);
    } catch (err) {
      console.error("Save failed:", err);
      alert(task?._id ? "Update failed." : "Creation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) return;
    setLoading(true);
    try {
      await axios.delete(`${base}/${task._id}`, getHeaders());
      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const { data } = await axios.post(`${base}/${task._id}/comments`, { content: newComment }, getHeaders());
      patch({ comments: [...(editedTask.comments || []), data] });
      setNewComment("");
      if (onUpdate) onUpdate();
    } catch (err) { console.error(err); }
  };

  const handleAddCheckItem = async () => {
    if (!newCheckItem.trim()) return;
    try {
      const { data } = await axios.post(`${base}/${task._id}/checklist`, { text: newCheckItem }, getHeaders());
      patch({ checklist: [...(editedTask.checklist || []), data] });
      setNewCheckItem("");
      if (onUpdate) onUpdate();
    } catch (err) { console.error(err); }
  };

  const handleToggle = async (itemId) => {
    try {
      const { data } = await axios.put(`${base}/${task._id}/checklist/${itemId}/toggle`, {}, getHeaders());
      const newCheck = (editedTask.checklist || []).map(i => i._id === itemId ? data : i);
      patch({ checklist: newCheck });
      if (onUpdate) onUpdate();
    } catch (err) { console.error(err); }
  };

  const handleArchive = async () => {
    setLoading(true);
    try {
      await axios.put(`${base}/${task._id}/archive`, { archive: true }, getHeaders());
      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      console.error("Archive failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const checklist = editedTask.checklist || [];
  const progress = checklist.length
    ? Math.round((checklist.filter((i) => i.completed).length / checklist.length) * 100)
    : 0;
  
  const statusCfg = STATUS_CONFIG[editedTask.status] || STATUS_CONFIG.todo;
  const priorityCfg = PRIORITY_CONFIG[editedTask.priority] || PRIORITY_CONFIG.Medium;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-card w-full max-w-5xl h-[90vh] flex flex-col rounded-[2.5rem] shadow-2xl overflow-hidden border border-base animate-in zoom-in-95 duration-300 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Area */}
        <header className="px-8 py-5 border-b border-slate-100 flex items-center gap-6 shrink-0 bg-white">
          <div className="flex items-center gap-3 shrink-0">
             <span className="text-[10px] font-bold bg-slate-50 px-2 py-1 rounded-xl text-slate-400 border border-slate-100 truncate max-w-[80px]">
                {task?._id ? `#${task._id.slice(-6).toUpperCase()}` : "NEW"}
             </span>
             <div className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border ${statusCfg.bg} ${statusCfg.color} border-current/10`}>
                {statusCfg.label}
             </div>
          </div>

          <div className="flex-1 min-w-0">
            <input
              className="w-full bg-transparent border-none text-xl font-extrabold text-slate-900 focus:ring-0 p-0 placeholder:text-slate-300 truncate tracking-tight"
              value={editedTask.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="Task title"
            />
          </div>

           <button 
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all shrink-0" 
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Tab Navigation */}
        <nav className="px-8 border-b border-base flex gap-1 shrink-0 bg-card">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-4 text-xs font-bold border-b-2 transition-all shrink-0 ${activeTab === id ? 'text-primary border-primary' : 'text-secondary border-transparent hover:text-primary hover:bg-main'}`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              {id === "checklist" && checklist.length > 0 && (
                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full border border-slate-200 ml-1">{checklist.length}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Main Operational Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col lg:flex-row bg-main/50">
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            {activeTab === "details" && (
              <div className="space-y-10">


                <section className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Description
                  </h4>
                  <textarea
                    className="w-full bg-card border border-base rounded-2xl p-5 text-sm text-primary placeholder:text-slate-300 focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all min-h-[200px] resize-none leading-relaxed shadow-sm font-medium"
                    value={editedTask.description || ""}
                    onChange={(e) => patch({ description: e.target.value })}
                    placeholder="Describe the objective, constraints, and success criteriaâ€¦"
                  />
                </section>

                <section className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Paperclip className="w-3.5 h-3.5" /> Attachments
                  </h4>
                  <div className="bg-card border border-base rounded-2xl p-6 shadow-sm">
                    <TaskAttachments
                      taskId={task._id}
                      attachments={editedTask.attachments || []}
                      onUpdate={(attachments) => patch({ attachments })}
                    />
                  </div>
                </section>
              </div>
            )}

            {activeTab === "checklist" && (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-card border border-base p-8 rounded-[2rem] shadow-sm space-y-6">
                  <div className="flex items-center justify-between px-1">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress</h4>
                      <span className="text-[10px] font-bold text-slate-900">{progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                      <div className="h-full bg-slate-900 transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
                  </div>

                  <div className="space-y-2 pt-4">
                      {checklist.map((item) => (
                      <button
                          key={item._id}
                          onClick={() => handleToggle(item._id)}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${item.completed ? 'bg-main border-base opacity-60' : 'bg-card border-base hover:border-slate-300 shadow-sm'}`}
                      >
                          <div className={`shrink-0 ${item.completed ? 'text-emerald-500' : 'text-slate-300'}`}>
                              {item.completed ? <CheckCircleIconSolidInner className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full border-2 border-current" />}
                          </div>
                          <p className={`text-sm font-semibold ${item.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{item.text}</p>
                      </button>
                      ))}
                  </div>

                  <div className="flex gap-2 pt-4">
                      <input
                          className="flex-1 bg-main border border-base rounded-xl px-4 py-3 text-sm text-primary focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all"
                          placeholder="Add new steps to complete the task..."
                          value={newCheckItem}
                          onChange={(e) => setNewCheckItem(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAddCheckItem()}
                      />
                      <button onClick={handleAddCheckItem} className="px-5 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md">Add</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="max-w-3xl mx-auto space-y-8 px-4">
                  <div className="relative pl-8 space-y-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                    {(editedTask.activity || task.activity || []).length > 0 ? (
                      [...(editedTask.activity || task.activity || [])].reverse().map((log, i) => (
                        <div key={i} className="relative">
                           <div className="absolute -left-[23px] top-1 w-4 h-4 rounded-full bg-white border-2 border-slate-900 z-10 flex items-center justify-center">
                              <RotateCw className="w-2.5 h-2.5 text-slate-900" />
                           </div>
                           <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                 <span className="text-xs font-bold text-slate-900">{log.user?.name || "System"}</span>
                                 <span className="text-xs text-slate-500 font-medium">{log.action}</span>
                              </div>
                              {log.details && <p className="text-[11px] text-slate-400 font-medium italic">"{log.details}"</p>}
                              <time className="text-[9px] font-bold text-slate-300 uppercase block tracking-widest">{new Date(log.timestamp).toLocaleString()}</time>
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center text-center opacity-30">
                        <BarChart2 className="w-8 h-8" />
                        <p className="text-[10px] font-black uppercase tracking-widest mt-3">No activity logged yet</p>
                      </div>
                    )}
                 </div>
              </div>
            )}

            {activeTab === "comments" && (
              <div className="max-w-3xl mx-auto space-y-8">
                 <div className="space-y-4">
                    {(editedTask.comments || []).map((c) => (
                    <div key={c._id} className="flex gap-4 p-5 bg-card border border-base rounded-2xl shadow-sm">
                        <div className="w-9 h-9 rounded-full bg-main flex items-center justify-center text-xs font-bold text-secondary shrink-0 border border-base">
                            {c.user?.name?.charAt(0) || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <strong className="text-xs text-slate-900 font-bold">{c.user?.name || "User"}</strong>
                                <time className="text-[10px] font-bold text-slate-400 uppercase">{new Date(c.createdAt).toLocaleDateString()}</time>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">{c.content}</p>
                        </div>
                    </div>
                    ))}
                 </div>

                 <div className="bg-card border border-base p-6 rounded-[2rem] shadow-sm space-y-4">
                    <textarea
                        className="w-full bg-main border border-base rounded-xl p-4 text-sm text-primary focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all outline-none min-h-[100px] resize-none"
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <div className="flex justify-end">
                        <button 
                            onClick={handleAddComment}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md"
                        >
                            <Send className="w-4 h-4" />
                            <span>Post</span>
                        </button>
                    </div>
                 </div>
              </div>
            )}
          </div>

          {/* Configuration Sidebar */}
          <aside className="w-full lg:w-80 p-8 bg-card border-l border-base space-y-8 overflow-y-auto no-scrollbar">
             <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 text-sky-600">Current Status</p>
                <div className="grid grid-cols-1 gap-2">
                    {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
                        <button
                            key={s}
                            onClick={() => patch({ status: s })}
                            className={`flex items-center justify-between p-3 rounded-xl text-xs font-bold border transition-all ${editedTask.status === s ? `bg-slate-900 text-white border-slate-900 dark:bg-indigo-600 dark:border-indigo-600 shadow-md` : 'text-secondary bg-main border-base hover:border-slate-300'}`}
                        >
                            <span>{cfg.label}</span>
                            {editedTask.status === s && <CheckCircleIconSolidInner className="w-4 h-4 text-emerald-400" />}
                        </button>
                    ))}
                </div>
             </div>

              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-rose-500" />
                  Labels
                </p>
                <div className="flex flex-wrap gap-1.5 px-1">
                   {(editedTask.labels || []).map((label, idx) => (
                      <div 
                        key={idx} 
                        className="h-8 px-3 rounded-lg flex items-center gap-2 border border-black/5 shadow-sm text-[10px] font-black text-white"
                        style={{ backgroundColor: label.color }}
                      >
                         <span>{label.text || ""}</span>
                         <button onClick={() => patch({ labels: editedTask.labels.filter((_, i) => i !== idx) })} className="hover:scale-110"><X className="w-3 h-3" /></button>
                      </div>
                   ))}
                   <div className="relative group/label">
                      <button className="h-8 w-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-200 transition-all">
                         <Plus className="w-4 h-4" />
                      </button>
                      <div className="absolute top-full right-0 mt-2 p-3 bg-white border border-base rounded-xl shadow-2xl z-[70] hidden group-hover/label:grid grid-cols-5 gap-2 w-48 animate-in fade-in slide-in-from-top-1 duration-200">
                         {LABEL_COLORS.map((c) => (
                            <button 
                              key={c.name}
                              className="w-6 h-6 rounded-md border border-black/5 hover:scale-110 transition-transform"
                              style={{ backgroundColor: c.color }}
                              onClick={() => {
                                 const labelText = prompt("Label text (optional):") || "";
                                 patch({ labels: [...(editedTask.labels || []), { color: c.color, text: labelText }] });
                              }}
                            />
                         ))}
                      </div>
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Priority Level</p>
                <div className="grid grid-cols-2 gap-2">
                    {Object.entries(PRIORITY_CONFIG).map(([p, cfg]) => (
                        <button
                            key={p}
                            onClick={() => patch({ priority: p })}
                            className={`p-2.5 rounded-xl text-[10px] font-bold border transition-all ${editedTask.priority === p ? `bg-slate-900 text-white border-slate-900 shadow-md` : 'text-slate-500 bg-slate-50 border-slate-200 hover:border-slate-300'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
             </div>

             <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 text-indigo-600">Assignment</p>
                <div className="relative">
                   <div className="relative">
                      <input
                        type="text"
                        className="w-full bg-main border border-base rounded-xl p-3 pr-10 text-sm text-primary font-semibold focus:ring-2 focus:ring-slate-900/5 outline-none transition-all placeholder:text-slate-400"
                        placeholder="Search user or email..."
                        value={assigneeSearch || (typeof editedTask.assignedTo === 'object' ? editedTask.assignedTo?.name : (editedTask.pendingAssigneeEmail ? `Invited: ${editedTask.pendingAssigneeEmail}` : (editedTask.assignedTo || "")))}
                        onChange={(e) => {
                          setAssigneeSearch(e.target.value);
                          setShowAssigneeDropdown(true);
                        }}
                        onFocus={() => setShowAssigneeDropdown(true)}
                      />
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4" />
                   </div>

                   {showAssigneeDropdown && (
                     <div className="absolute z-50 mt-2 w-full bg-card border border-base rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="max-h-48 overflow-y-auto no-scrollbar py-1">
                           <button
                             className="w-full px-4 py-2.5 text-xs font-bold text-rose-500 hover:bg-main flex items-center gap-2 border-b border-base/50"
                             onClick={() => {
                               patch({ assignedTo: null, pendingAssigneeEmail: null });
                               setAssigneeSearch("");
                               setShowAssigneeDropdown(false);
                             }}
                           >
                             <X className="w-3.5 h-3.5" /> No assignee
                           </button>

                           {/* Existing Users */}
                           {users
                             .filter(u => !assigneeSearch || u.name.toLowerCase().includes(assigneeSearch.toLowerCase()) || u.email.toLowerCase().includes(assigneeSearch.toLowerCase()))
                             .map(u => (
                               <button
                                 key={u._id}
                                 className="w-full px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-main flex items-center gap-3 transition-colors"
                                 onClick={() => {
                                   patch({ assignedTo: u._id, pendingAssigneeEmail: null });
                                   setAssigneeSearch(u.name);
                                   setShowAssigneeDropdown(false);
                                 }}
                               >
                                 <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                                   {u.name.charAt(0)}
                                 </div>
                                 <div className="flex flex-col items-start overflow-hidden">
                                   <span className="truncate w-full">{u.name}</span>
                                   <span className="text-[10px] text-slate-400 truncate w-full">{u.email}</span>
                                 </div>
                               </button>
                             ))
                           }

                           {/* Custom Email Option */}
                           {assigneeSearch && /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(assigneeSearch) && (
                             <button
                               className="w-full px-4 py-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex items-center gap-3 transition-colors border-t border-indigo-100"
                               onClick={() => {
                                 patch({ assignedTo: assigneeSearch, pendingAssigneeEmail: null });
                                 setShowAssigneeDropdown(false);
                               }}
                             >
                               <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                 @
                               </div>
                               <div className="flex flex-col items-start">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Assignment Target</span>
                                 <span className="text-sm font-bold truncate">{assigneeSearch}</span>
                               </div>
                             </button>
                           )}
                           
                           {assigneeSearch && !users.some(u => u.name.toLowerCase().includes(assigneeSearch.toLowerCase()) || u.email.toLowerCase().includes(assigneeSearch.toLowerCase())) && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(assigneeSearch) && (
                             <div className="px-4 py-10 text-center space-y-2">
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Member Found</p>
                               <p className="text-[9px] text-slate-300 font-medium">Type a valid email to invite anyone.</p>
                             </div>
                           )}
                        </div>
                     </div>
                   )}
                </div>
                {showAssigneeDropdown && (
                  <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowAssigneeDropdown(false)} />
                )}
             </div>

             <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 text-emerald-600">Workspace Assignment</p>
                <div className="relative group">
                   <select
                        className="w-full bg-main border border-base rounded-xl p-3 text-sm text-primary font-semibold focus:ring-2 focus:ring-slate-900/5 appearance-none cursor-pointer outline-none transition-all"
                        value={typeof editedTask.project === 'object' ? editedTask.project?._id : (editedTask.project || "")}
                        onChange={(e) => patch({ project: e.target.value })}
                    >
                        <option value="">Global (No Workspace)</option>
                        {projects.map((p) => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                    </select>
                    <Folder className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4" />
                </div>
             </div>

             <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Deadline</p>
                <div className="relative">
                   <input
                        type="date"
                        className="w-full bg-main border border-base rounded-xl p-3 text-sm text-primary font-semibold focus:ring-2 focus:ring-slate-900/5 outline-none transition-all cursor-pointer"
                        value={editedTask.dueDate ? editedTask.dueDate.split("T")[0] : ""}
                        onChange={(e) => patch({ dueDate: e.target.value })}
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4" />
                </div>
             </div>
          </aside>
        </div>

        {/* Action Footer */}
        <footer className="px-8 py-5 border-t border-base flex justify-between items-center shrink-0 bg-card">
          <div className="flex gap-2">
            <button 
              className={`flex items-center gap-2 px-4 py-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl font-bold text-xs uppercase transition-all ${!task?._id ? 'hidden' : ''}`} 
              onClick={handleArchive}
              disabled={loading}
            >
              <RotateCw className="w-4 h-4" />
              <span>Archive</span>
            </button>
            <button 
              className={`flex items-center gap-2 px-4 py-2.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl font-bold text-xs uppercase transition-all ${!task?._id ? 'opacity-30 cursor-not-allowed grayscale' : ''}`} 
              onClick={handleDelete}
              disabled={loading || !task?._id}
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>

          <div className="flex gap-3">
            <button className="px-6 py-2.5 text-slate-400 hover:text-slate-900 font-bold text-xs uppercase transition-all" onClick={onClose}>
                Discard
            </button>
            <button
                className={`px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md flex items-center gap-2 group active:scale-95 ${saved ? 'bg-emerald-500 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
                onClick={handleSave}
                disabled={loading || saved || !editedTask.title?.trim()}
            >
                {saved ? <CheckCircleIconSolidInner className="w-4 h-4 text-emerald-400" /> : <SaveIcon className="w-4 h-4" />}
                {loading ? (task?._id ? "Syncing..." : "Creating...") : saved ? "Synced!" : (task?._id ? "Save changes" : "Create Task")}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
