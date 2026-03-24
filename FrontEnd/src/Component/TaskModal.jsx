import React, { useState } from "react";
import axios from "axios";
import {
  X,
  Flag,
  Clock,
  Save,
  Plus,
  Send,
  CheckSquare,
  MessageSquare,
  Activity,
  Circle,
  CheckCircle2,
  User,
  Calendar,
  Layers,
  Tag,
  Paperclip,
} from "lucide-react";
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
  { id: "details", label: "Details", Icon: Layers },
  { id: "checklist", label: "Checklist", Icon: CheckSquare },
  { id: "comments", label: "Comments", Icon: MessageSquare },
  { id: "activity", label: "Activity", Icon: Activity },
];

export default function TaskModal({ task, onClose, onUpdate, users = [], projects = [] }) {
  const [editedTask, setEditedTask] = useState(task);
  const [newComment, setNewComment] = useState("");
  const [newCheckItem, setNewCheckItem] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { headers: { Authorization: `Bearer ${token}` } };
  const base = "http://localhost:5000/api/tasks";

  const patch = (fields) => setEditedTask((prev) => ({ ...prev, ...fields }));

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await axios.put(`${base}/${task._id}`, editedTask, headers);
      if (onUpdate) onUpdate(data);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const { data } = await axios.post(`${base}/${task._id}/comments`, { content: newComment }, headers);
      patch({ comments: [...(editedTask.comments || []), data] });
      setNewComment("");
    } catch (err) { console.error(err); }
  };

  const handleAddCheckItem = async () => {
    if (!newCheckItem.trim()) return;
    try {
      const { data } = await axios.post(`${base}/${task._id}/checklist`, { text: newCheckItem }, headers);
      patch({ checklist: [...(editedTask.checklist || []), data] });
      setNewCheckItem("");
    } catch (err) { console.error(err); }
  };

  const handleToggle = async (itemId) => {
    try {
      const { data } = await axios.put(`${base}/${task._id}/checklist/${itemId}/toggle`, {}, headers);
      patch({ checklist: editedTask.checklist.map((i) => (i._id === itemId ? data : i)) });
    } catch (err) { console.error(err); }
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
        className="bg-white w-full max-w-5xl h-[90vh] rounded-[2rem] border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Area */}
        <header className="px-8 py-5 border-b border-slate-100 flex items-center gap-6 shrink-0 bg-white">
          <div className="flex items-center gap-3 shrink-0">
             <span className="text-[10px] font-bold bg-slate-50 px-2 py-1 rounded-md text-slate-400 border border-slate-100 truncate max-w-[80px]">#{task._id.slice(-6).toUpperCase()}</span>
             <div className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${statusCfg.bg} ${statusCfg.color} border-current/10`}>
                {statusCfg.label}
             </div>
          </div>

          <div className="flex-1 min-w-0">
            <input
              className="w-full bg-transparent border-none text-xl font-extrabold text-slate-900 focus:ring-0 p-0 placeholder:text-slate-300 truncate tracking-tight"
              value={editedTask.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="What's the task called?"
            />
          </div>

          <button 
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all shrink-0" 
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>

        {/* Tab Navigation */}
        <nav className="px-8 border-b border-slate-100 flex gap-1 shrink-0 bg-white">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-4 text-xs font-bold border-b-2 transition-all shrink-0 ${activeTab === id ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'}`}
            >
              <Icon size={14} />
              <span>{label}</span>
              {id === "checklist" && checklist.length > 0 && (
                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full border border-slate-200 ml-1">{checklist.length}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Main Operational Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col lg:flex-row bg-[#F9FAFB]/50">
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            {activeTab === "details" && (
              <div className="space-y-10">
                <section className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Description
                  </h4>
                  <textarea
                    className="w-full bg-white border border-slate-200 rounded-2xl p-5 text-sm text-slate-800 placeholder:text-slate-300 focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all min-h-[200px] resize-none leading-relaxed shadow-sm font-medium"
                    value={editedTask.description || ""}
                    onChange={(e) => patch({ description: e.target.value })}
                    placeholder="Describe the objective, constraints, and success criteria…"
                  />
                </section>

                <section className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Paperclip size={14} /> Attachments
                  </h4>
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
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
                <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm space-y-6">
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
                          className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${item.completed ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'}`}
                      >
                          <div className={`shrink-0 ${item.completed ? 'text-emerald-500' : 'text-slate-300'}`}>
                              {item.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                          </div>
                          <p className={`text-sm font-semibold ${item.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{item.text}</p>
                      </button>
                      ))}
                  </div>

                  <div className="flex gap-2 pt-4">
                      <input
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all"
                          placeholder="Add new step…"
                          value={newCheckItem}
                          onChange={(e) => setNewCheckItem(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAddCheckItem()}
                      />
                      <button onClick={handleAddCheckItem} className="px-5 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md">Add</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "comments" && (
              <div className="max-w-3xl mx-auto space-y-8">
                 <div className="space-y-4">
                    {editedTask.comments?.map((c) => (
                    <div key={c._id} className="flex gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0 border border-slate-200">
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

                 <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm space-y-4">
                    <textarea
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-800 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all outline-none min-h-[100px] resize-none"
                        placeholder="Write a message…"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <div className="flex justify-end">
                        <button 
                            onClick={handleAddComment}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md"
                        >
                            <Send size={14} />
                            <span>Send</span>
                        </button>
                    </div>
                 </div>
              </div>
            )}
          </div>

          {/* Configuration Sidebar */}
          <aside className="w-full lg:w-80 p-8 bg-white border-l border-slate-100 space-y-8 overflow-y-auto no-scrollbar">
             <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Assignment</p>
                <div className="relative group">
                   <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 font-semibold focus:ring-2 focus:ring-slate-900/5 appearance-none cursor-pointer outline-none transition-all"
                        value={editedTask.assignedTo || ""}
                        onChange={(e) => patch({ assignedTo: e.target.value })}
                    >
                        <option value="">No assignee</option>
                        {users.map((u) => (
                            <option key={u._id} value={u._id}>{u.name}</option>
                        ))}
                    </select>
                    <User size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Deadline</p>
                <div className="relative">
                   <input
                        type="date"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 font-semibold focus:ring-2 focus:ring-slate-900/5 outline-none transition-all cursor-pointer"
                        value={editedTask.dueDate ? editedTask.dueDate.split("T")[0] : ""}
                        onChange={(e) => patch({ dueDate: e.target.value })}
                    />
                    <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
             </div>

             <div className="pt-8 border-t border-slate-100">
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                   <div className="flex items-center gap-2 text-amber-600 mb-1">
                      <Clock size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Time Logs</span>
                   </div>
                   <p className="text-[10px] text-amber-700 font-medium">This task has been in 'In progress' for 3 days.</p>
                </div>
             </div>
          </aside>
        </div>

        {/* Action Footer */}
        <footer className="px-8 py-5 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-white">
          <button className="px-6 py-2.5 text-slate-400 hover:text-slate-900 font-bold text-xs uppercase transition-all" onClick={onClose}>
            Discard
          </button>
          <button
            className="px-8 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md flex items-center gap-2 group active:scale-95"
            onClick={handleSave}
            disabled={loading}
          >
            <Save size={14} />
            {loading ? "Syncing…" : "Save changes"}
          </button>
        </footer>
      </div>
    </div>
  );
}
