import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  Plus,
  StickyNote,
  Trash2,
  Pin,
  PinOff,
  Tag,
  Calendar,
  X,
  Palette,
  Check,
  ChevronRight,
  MoreVertical,
  Maximize2,
  Archive,
  Save,
  RotateCcw
} from "lucide-react";

const Note = ({ selectedProjectId }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // all, pinned, archived
  
  // Note Form State
  const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
    color: "#ffffff",
    tags: [],
    isPinned: false
  });

  const [tagInput, setTagInput] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colors = [
    { name: "White", value: "#ffffff" },
    { name: "Soft Blue", value: "#e0f2fe" },
    { name: "Soft Green", value: "#dcfce7" },
    { name: "Soft Yellow", value: "#fef9c3" },
    { name: "Soft Purple", value: "#f3e8ff" },
    { name: "Soft Rose", value: "#ffe4e6" },
    { name: "Soft Amber", value: "#fef3c7" },
    { name: "Soft Slate", value: "#f1f5f9" }
  ];

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  useEffect(() => {
    fetchNotes();
  }, [selectedProjectId, activeFilter]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const projectParam = selectedProjectId || "all";
      const pinnedParam = activeFilter === "pinned" ? "&pinnedOnly=true" : "";
      
      const res = await axios.get(
        `http://localhost:5000/api/notes?project=${projectParam}${pinnedParam}`,
        getHeaders()
      );
      setNotes(res.data);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    // If both are empty, don't save
    if (!noteForm.title.trim() && !noteForm.content.trim()) {
        alert("Please enter a title or some content for your note.");
        return;
    }

    try {
      const finalTitle = noteForm.title.trim() || "Untitled Note";
      const payload = { ...noteForm, title: finalTitle };

      if (editingNote) {
        const res = await axios.put(
          `http://localhost:5000/api/notes/${editingNote._id}`,
          payload,
          getHeaders()
        );
        setNotes(notes.map(n => n._id === editingNote._id ? res.data : n));
      } else {
        const res = await axios.post(
          "http://localhost:5000/api/notes",
          { ...payload, project: selectedProjectId },
          getHeaders()
        );
        setNotes([res.data, ...notes]);
      }
      alert("Note saved successfully!");
      closeModal();
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Error saving note: " + (error.response?.data?.message || error.message));
    }
  };

  const deleteNote = async (id) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/notes/${id}`, getHeaders());
      setNotes(notes.filter(n => n._id !== id));
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const togglePin = async (e, note) => {
    e.stopPropagation();
    try {
      const res = await axios.put(
        `http://localhost:5000/api/notes/${note._id}/toggle-pin`,
        {},
        getHeaders()
      );
      setNotes(notes.map(n => n._id === note._id ? res.data : n));
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
  };

  const openModal = (note = null) => {
    if (note) {
      setEditingNote(note);
      setNoteForm({
        title: note.title,
        content: note.content,
        color: note.color,
        tags: note.tags,
        isPinned: note.isPinned
      });
    } else {
      setEditingNote(null);
      setNoteForm({
        title: "",
        content: "",
        color: "#ffffff",
        tags: [],
        isPinned: false
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
    setTagInput("");
    setShowColorPicker(false);
  };

  const addTag = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      if (!noteForm.tags.includes(tagInput.trim())) {
        setNoteForm({ ...noteForm, tags: [...noteForm.tags, tagInput.trim()] });
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setNoteForm({
      ...noteForm,
      tags: noteForm.tags.filter(t => t !== tagToRemove)
    });
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col bg-slate-50/50 min-h-full p-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <StickyNote size={32} className="text-indigo-600" />
             NOTEPAD
          </h1>
          <p className="text-slate-500 font-bold text-xs mt-1 tracking-widest uppercase opacity-70">
            {selectedProjectId ? "Project specific notes" : "Your personal workspace notes"}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all w-64 md:w-80 shadow-sm"
            />
          </div>

          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all hover:bg-indigo-700"
          >
            <Plus size={18} />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex items-center gap-3 mb-8">
        {[
          { id: "all", label: "All Notes" },
          { id: "pinned", label: "Pinned" },
        ].map(filter => (
          <button
             key={filter.id}
             onClick={() => setActiveFilter(filter.id)}
             className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === filter.id ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-indigo-600'}`}
          >
             {filter.label}
          </button>
        ))}
      </div>

      {/* NOTES GRID */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 grayscale opacity-50">
           <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading notepad...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 grayscale opacity-40">
           <div className="bg-slate-100 p-8 rounded-[2.5rem] mb-6">
              <StickyNote size={64} className="text-slate-400" />
           </div>
           <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">No notes found</h3>
           <p className="text-slate-500 font-bold text-sm">Capture your first brilliant idea today</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
          {filteredNotes.map((note) => (
            <div
              key={note._id}
              onClick={() => openModal(note)}
              style={{ backgroundColor: note.color }}
              className="group relative rounded-[2rem] p-8 border border-slate-200/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden max-h-[400px] flex flex-col"
            >
              {/* PIN BUTTON */}
              {/* ACTIONS BAR */}
              <div className="absolute top-6 right-6 flex items-center gap-2 z-10 transition-all duration-300">
                <button
                  onClick={(e) => togglePin(e, note)}
                  className={`p-2 rounded-xl transition-all duration-300 ${note.isPinned ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-white/80 text-slate-400 opacity-40 group-hover:opacity-100'}`}
                  title="Pin Note"
                >
                  <Pin size={16} />
                </button>
              </div>

              <div className="relative z-10 flex-1 overflow-hidden">
                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-4 break-words group-hover:text-indigo-600 transition-colors pr-8">
                  {note.title}
                </h3>
                <p className="text-slate-600 font-medium text-sm leading-relaxed mb-6 whitespace-pre-wrap line-clamp-6">
                  {note.content}
                </p>
              </div>

              <div className="relative z-10 mt-auto pt-6 border-t border-slate-900/5 flex flex-col gap-4">
                {note.tags?.length > 0 && (
                   <div className="flex flex-wrap gap-2">
                     {note.tags.slice(0, 3).map((tag, i) => (
                       <span key={i} className="px-2 py-0.5 bg-white/50 rounded-lg text-[8px] font-black uppercase tracking-widest text-slate-600 border border-slate-900/5">
                         {tag}
                       </span>
                     ))}
                     {note.tags.length > 3 && <span className="text-[8px] font-black text-slate-400">+{note.tags.length - 3}</span>}
                   </div>
                )}
                
                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   <div className="flex items-center gap-2">
                      <Calendar size={12} className="opacity-50" />
                      <span>{new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                   </div>
                   <button 
                      onClick={(e) => { e.stopPropagation(); deleteNote(note._id); }}
                      className="p-2 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                   >
                      <Trash2 size={16} />
                   </button>
                </div>
              </div>

              {/* Decorative accent */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-white/0 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
            </div>
          ))}
        </div>
      )}

      {/* NOTE MODAL */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div 
             style={{ backgroundColor: noteForm.color }}
             className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/50 flex flex-col max-h-[85vh]"
          >
            {/* MODAL HEADER */}
            <div className="px-10 py-8 flex items-center justify-between border-b border-black/5 bg-white/30 backdrop-blur-md">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                     <StickyNote size={20} />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                     {editingNote ? "Edit Note" : "Capture Idea"}
                  </span>
               </div>
               <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setNoteForm({ ...noteForm, isPinned: !noteForm.isPinned })}
                    className={`p-3 rounded-2xl transition-all ${noteForm.isPinned ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                  >
                    <Pin size={18} />
                  </button>
                  <button onClick={closeModal} className="p-3 bg-slate-100 text-slate-400 hover:bg-slate-200 transition-all rounded-2xl"><X size={18} /></button>
               </div>
            </div>

            {/* MODAL BODY */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-10 py-8 space-y-8 bg-white/10">
               <input
                 type="text"
                 placeholder="Enter a descriptive title..."
                 value={noteForm.title}
                 onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                 className="w-full bg-transparent border-none text-2xl font-black text-slate-900 placeholder:text-slate-300 focus:outline-none tracking-tight"
               />

               <textarea
                 placeholder="Start typing your thoughts here..."
                 value={noteForm.content}
                 onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                 className="w-full bg-transparent border-none text-lg font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none min-h-[300px] resize-none leading-relaxed"
               />

               {/* TAGS */}
               <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-400">
                     <Tag size={16} />
                     <span className="text-[10px] font-black uppercase tracking-widest">Tags & Labels</span>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                     {noteForm.tags.map((tag, i) => (
                       <div key={i} className="flex items-center gap-2 px-3 py-1 bg-white rounded-xl border border-slate-200 text-xs font-bold text-indigo-600 shadow-sm animate-in zoom-in-90 duration-200">
                         <span>{tag}</span>
                         <X size={14} className="cursor-pointer hover:text-rose-500" onClick={() => removeTag(tag)} />
                       </div>
                     ))}
                     <input
                       type="text"
                       placeholder="Add tag + press Enter"
                       value={tagInput}
                       onChange={(e) => setTagInput(e.target.value)}
                       onKeyDown={addTag}
                       className="bg-transparent border-none text-xs font-bold text-slate-500 placeholder:text-slate-300 focus:outline-none min-w-[150px] py-2"
                     />
                  </div>
               </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="px-10 py-8 border-t border-black/5 bg-white/30 backdrop-blur-md flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="relative">
                    <button 
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="p-3 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 shadow-sm rounded-2xl transition-all"
                      title="Choose background color"
                    >
                      <Palette size={20} />
                    </button>
                    {showColorPicker && (
                      <div className="absolute bottom-16 left-0 bg-white p-4 rounded-3xl shadow-2xl border border-slate-100 flex gap-2 z-[110] animate-in slide-in-from-bottom-5 duration-300">
                        {colors.map(c => (
                          <button
                             key={c.value}
                             onClick={() => { setNoteForm({ ...noteForm, color: c.value }); setShowColorPicker(false); }}
                             style={{ backgroundColor: c.value }}
                             className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-125 ${noteForm.color === c.value ? 'border-indigo-600 scale-110 shadow-lg shadow-indigo-600/20' : 'border-slate-100'}`}
                             title={c.name}
                          />
                        ))}
                      </div>
                    )}
                  </div>
               </div>

               <div className="flex items-center gap-3">
                  <button 
                     onClick={closeModal}
                     className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all"
                  >
                     Discard
                  </button>
                  <button 
                    onClick={handleCreateOrUpdate}
                    className="flex items-center gap-2 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/25 hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    <Save size={18} />
                    <span>{editingNote ? "Save Changes" : "Save Note"}</span>
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Note;
