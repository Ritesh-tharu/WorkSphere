import React, { useEffect, useState } from "react";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Plus,
  X,
  Flag,
  MessageSquare,
  MoreHorizontal,
  Plus as PlusIcon,
  Paperclip,
  CheckSquare,
  Eye,
  MoreVertical,
  Link,
  BarChart3,
  Users as UsersIcon,
  Search,
  Calendar,
  Filter,
  Clock,
} from "lucide-react";
import TaskModal from "./TaskModal";
import SearchFilters from "./SearchFilters";

const priorityColors = {
  Low: "border-l-4 border-emerald-500",
  Medium: "border-l-4 border-amber-500",
  High: "border-l-4 border-rose-500",
  Urgent: "border-l-4 border-purple-500",
};

const TaskBoard = ({ selectedProjectId }) => {
  const [columns, setColumns] = useState({});
  const [addingCardTo, setAddingCardTo] = useState(null);
  const [showAddList, setShowAddList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState("board");
  const [projectStats, setProjectStats] = useState({
    todo: 0,
    doing: 0,
    completed: 0,
    total: 0,
    completionRate: 0
  });
  const [activeMenuCol, setActiveMenuCol] = useState(null);
  const [editingCol, setEditingCol] = useState(null);
  const [tempColName, setTempColName] = useState("");

  const token = localStorage.getItem("token");

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  useEffect(() => {
    fetchInitialData();
  }, [selectedProjectId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchTasks(), 
        fetchUsers(), 
        fetchProjects(),
        fetchProjectStats()
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectStats = async () => {
    if (!selectedProjectId) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/tasks/stats?project=${selectedProjectId}`, getHeaders());
      setProjectStats({
        todo: res.data.todoTasks || 0,
        doing: res.data.inProgressTasks || 0,
        completed: res.data.completedTasks || 0,
        total: res.data.totalTasks || 0,
        completionRate: res.data.completionRate || 0
      });
    } catch (error) {
      console.error("Error fetching project stats:", error);
    }
  };

  const fetchTasks = async () => {
    const url = selectedProjectId 
      ? `http://localhost:5000/api/tasks?project=${selectedProjectId}` 
      : "http://localhost:5000/api/tasks";
    const res = await axios.get(url, getHeaders());
    
    // Default columns
    const initialCols = {
      todo: { name: "To do", items: [] },
      doing: { name: "Doing", items: [] },
      completed: { name: "Done", items: [] },
    };

    const sortedTasks = res.data.sort((a, b) => (a.position || 0) - (b.position || 0));
    
    // Dynamically identify all statuses
    const colMap = { ...initialCols };
    sortedTasks.forEach(task => {
        if (!colMap[task.status]) {
            colMap[task.status] = { name: task.status.replace(/_/g, ' ').toUpperCase(), items: [] };
        }
        if (!task.isArchived) {
            colMap[task.status].items.push(task);
        }
    });

    setColumns(colMap);
  };

  const fetchUsers = async () => {
    const res = await axios.get("http://localhost:5000/api/invitations/team", getHeaders());
    setUsers(res.data);
  };

  const fetchProjects = async () => {
    const res = await axios.get("http://localhost:5000/api/projects", getHeaders());
    setProjects(res.data);
  };

  const createTask = async (status) => {
    if (!newTaskTitle.trim()) {
      setAddingCardTo(null);
      return;
    }
    try {
      const res = await axios.post("http://localhost:5000/api/tasks", {
        title: newTaskTitle,
        status,
        priority: "Medium",
        assignedTo: null,
        project: selectedProjectId,
      }, getHeaders());
      
      setColumns((prev) => ({
        ...prev,
        [status]: { ...prev[status], items: [...prev[status].items, res.data] },
      }));
      setNewTaskTitle("");
      setAddingCardTo(null);
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const addList = () => {
    if (!newListTitle.trim()) {
        setShowAddList(false);
        return;
    }
    const status = newListTitle.toLowerCase().replace(/\s/g, '_');
    setColumns(prev => ({
        ...prev,
        [status]: { name: newListTitle, items: [] }
    }));
    setNewListTitle("");
    setShowAddList(false);
  };
  
  const deleteList = async (columnId) => {
    const column = columns[columnId];
    if (column.items.length > 0) {
      if (!window.confirm(`Are you sure you want to delete "${column.name}" and all its ${column.items.length} tasks?`)) return;
    } else {
      if (!window.confirm(`Delete list "${column.name}"?`)) return;
    }
    
    try {
      // Delete tasks in the list first
      await Promise.all(column.items.map(item => axios.delete(`http://localhost:5000/api/tasks/${item._id}`, getHeaders())));
      
      // Update local state
      const newCols = { ...columns };
      delete newCols[columnId];
      setColumns(newCols);
      setActiveMenuCol(null);
    } catch (error) {
      console.error("Error deleting list:", error);
    }
  };

  const renameList = async (columnId) => {
    if (!tempColName.trim() || tempColName === columns[columnId].name) {
      setEditingCol(null);
      return;
    }

    const oldName = columns[columnId].name;
    const newStatus = tempColName.toLowerCase().replace(/\s/g, '_');
    
    try {
      // Update all tasks in this list to the new status
      await Promise.all(columns[columnId].items.map(item => 
        axios.put(`http://localhost:5000/api/tasks/${item._id}`, { status: newStatus }, getHeaders())
      ));

      setColumns(prev => {
        const newCols = { ...prev };
        const items = newCols[columnId].items.map(it => ({ ...it, status: newStatus }));
        delete newCols[columnId];
        newCols[newStatus] = { name: tempColName, items };
        return newCols;
      });
      setEditingCol(null);
      setActiveMenuCol(null);
    } catch (error) {
      console.error("Error renaming list:", error);
    }
  };

  const handleSearchResults = (tasks) => {
    const newColumns = {
      todo: { name: "To do", items: [] },
      doing: { name: "In Progress", items: [] },
      completed: { name: "Done", items: [] },
    };

    tasks.forEach(task => {
      const status = task.status || 'todo';
      if (newColumns[status]) {
        newColumns[status].items.push(task);
      }
    });

    setColumns(newColumns);
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceCol = columns[source.droppableId];
    const destCol = columns[destination.droppableId];
    const sourceItems = Array.from(sourceCol.items);
    
    if (source.droppableId === destination.droppableId) {
      const [removed] = sourceItems.splice(source.index, 1);
      sourceItems.splice(destination.index, 0, removed);
      const updatedItems = sourceItems.map((item, index) => ({ ...item, position: index }));
      setColumns({ ...columns, [source.droppableId]: { ...sourceCol, items: updatedItems } });
      try {
        await axios.post("http://localhost:5000/api/tasks/positions", {
          tasks: updatedItems.map((item, index) => ({ id: item._id, status: source.droppableId, position: index }))
        }, getHeaders());
      } catch (e) { fetchTasks(); }
    } else {
      const destItems = Array.from(destCol.items);
      const [moved] = sourceItems.splice(source.index, 1);
      moved.status = destination.droppableId;
      destItems.splice(destination.index, 0, moved);
      setColumns({
        ...columns,
        [source.droppableId]: { ...sourceCol, items: sourceItems.map((it, i) => ({ ...it, position: i })) },
        [destination.droppableId]: { ...destCol, items: destItems.map((it, i) => ({ ...it, position: i })) },
      });
      try {
        await axios.put(`http://localhost:5000/api/tasks/${moved._id}`, { status: destination.droppableId }, getHeaders());
        await axios.post("http://localhost:5000/api/tasks/positions", {
          tasks: [
            ...sourceItems.map((it, i) => ({ id: it._id, status: source.droppableId, position: i })),
            ...destItems.map((it, i) => ({ id: it._id, status: destination.droppableId, position: i }))
          ]
        }, getHeaders());
      } catch (e) { fetchTasks(); }
    }
  };

  const currentProject = projects.find(p => p._id === selectedProjectId);

  return (
    <div className="flex-1 overflow-hidden h-full flex flex-col bg-main/50 animate-in fade-in duration-700">
      {/* Project Management Header */}
      <div className="px-8 pt-8 pb-4 border-b border-base bg-card/30 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-base flex items-center justify-center shadow-sm group">
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: currentProject?.color || '#6366f1' }} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-black text-primary tracking-tight uppercase">{currentProject?.name || "Global Workspace"}</h2>
                <div className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${currentProject ? 'text-indigo-600 bg-indigo-50 border-indigo-200' : 'text-slate-500 bg-slate-100 border-slate-200'}`}>
                  {currentProject ? 'Project' : 'General'}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 group cursor-pointer">
                  <div className="w-32 h-1.5 bg-base rounded-full overflow-hidden border border-base/50">
                    <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${projectStats.completionRate}%` }} />
                  </div>
                  <span className="text-[10px] font-black text-secondary tracking-widest uppercase">{projectStats.completionRate}% Progress</span>
                </div>
                <div className="h-3 w-[1px] bg-base" />
                <div className="flex -space-x-2">
                  {users.slice(0, 4).map((user, i) => (
                    <div key={user._id} className="w-7 h-7 rounded-full border-2 border-card bg-main flex items-center justify-center overflow-hidden grayscale hover:grayscale-0 transition-all" title={user.name}>
                      {user.profilePhoto ? <img src={`http://localhost:5000${user.profilePhoto}`} className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold text-secondary">{user.name.charAt(0)}</span>}
                    </div>
                  ))}
                  {users.length > 4 && (
                    <div className="w-7 h-7 rounded-full border-2 border-card bg-slate-900 flex items-center justify-center text-[10px] font-bold text-white">
                      +{users.length - 4}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
          <div className="flex items-center gap-6 flex-1 max-w-2xl px-8 border-x border-base">
             <SearchFilters 
               onSearchResults={handleSearchResults} 
               initialFilters={{ project: selectedProjectId }} 
             />
          </div>
             <button className="p-2.5 bg-main border border-base rounded-xl text-secondary hover:text-indigo-500 transition-all shadow-xs">
                <Filter size={16} />
             </button>
             <button 
                onClick={() => setAddingCardTo(Object.keys(columns)[0])}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
             >
                <PlusIcon size={14} />
                <span>New Task</span>
             </button>
          </div>
        </div>

        <div className="flex items-center gap-8 px-1">
          {[
            { id: 'board', label: 'Kanban Board', Icon: Link },
            { id: 'analytics', label: 'Analytics', Icon: BarChart3 },
            { id: 'team', label: 'Project Team', Icon: UsersIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 pb-3 px-1 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative border-b-2 ${
                activeTab === tab.id ? 'text-indigo-600 border-indigo-600' : 'text-secondary border-transparent hover:text-primary'
              }`}
            >
              <tab.Icon size={14} className={activeTab === tab.id ? 'text-indigo-600' : 'text-secondary'} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 opacity-60">
           <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
           <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-secondary animate-pulse">Syncing Hub...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto custom-scrollbar">
          {activeTab === 'board' ? (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex gap-6 p-8 h-full min-w-max items-start">
                {Object.entries(columns).map(([columnId, column]) => (
                  <div key={columnId} className="w-80 flex flex-col shrink-0 bg-card/40 backdrop-blur-sm border border-base/50 rounded-2xl max-h-full shadow-sm group/list transition-all hover:bg-card/60">
                    <div className="flex items-center justify-between p-4 pb-2 shrink-0">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {editingCol === columnId ? (
                          <input
                            autoFocus
                            className="bg-main border border-indigo-500/30 rounded-md px-2 py-1 text-[11px] font-bold text-primary outline-none w-full"
                            value={tempColName}
                            onChange={(e) => setTempColName(e.target.value)}
                            onBlur={() => renameList(columnId)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") renameList(columnId);
                              if (e.key === "Escape") setEditingCol(null);
                            }}
                          />
                        ) : (
                          <h3 className="font-bold text-primary text-[11px] uppercase tracking-widest opacity-70 truncate">
                            {column.name}
                          </h3>
                        )}
                        <span className="bg-base/50 text-secondary text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0">
                          {column.items.length}
                        </span>
                      </div>
                      
                      <div className="relative shrink-0">
                        <button 
                          onClick={() => setActiveMenuCol(activeMenuCol === columnId ? null : columnId)}
                          className="text-secondary opacity-0 group-hover/list:opacity-100 transition-all hover:text-primary p-1 rounded-md hover:bg-main"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        
                        {activeMenuCol === columnId && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveMenuCol(null)} />
                            <div className="absolute right-0 mt-2 w-36 bg-card border border-base rounded-xl shadow-xl z-20 py-1 animate-in fade-in zoom-in-95 duration-200">
                              <button
                                onClick={() => {
                                  setEditingCol(columnId);
                                  setTempColName(column.name);
                                  setActiveMenuCol(null);
                                }}
                                className="w-full text-left px-4 py-2 text-[10px] font-bold text-secondary hover:bg-main hover:text-primary uppercase tracking-widest transition-colors"
                              >
                                Rename List
                              </button>
                              <button
                                onClick={() => deleteList(columnId)}
                                className="w-full text-left px-4 py-2 text-[10px] font-bold text-rose-500 hover:bg-rose-50 uppercase tracking-widest transition-colors"
                              >
                                Delete List
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <Droppable droppableId={columnId}>
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`px-3 py-2 overflow-y-auto custom-scrollbar min-h-[50px] space-y-3 ${snapshot.isDraggingOver ? 'bg-indigo-500/5 rounded-xl' : ''}`}
                        >
                          {column.items.map((item, index) => {
                            const checklist = item.checklist || [];
                            const completed = checklist.filter(i => i.completed).length;
                            const total = checklist.length;
                            
                            let coverUrl = item.coverImage;
                            if (!coverUrl && item.attachments?.length > 0) {
                              const firstImage = item.attachments.find(a => a.mimeType?.startsWith('image/'));
                              if (firstImage) {
                                coverUrl = `http://localhost:5000${firstImage.url || firstImage.path}`;
                              }
                            } else if (coverUrl && !coverUrl.startsWith('http')) {
                              coverUrl = `http://localhost:5000${coverUrl}`;
                            }

                            return (
                              <Draggable key={item._id} draggableId={item._id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`bg-card rounded-2xl shadow-sm hover:shadow-xl hover:border-indigo-500/30 transition-all shrink-0 border border-base group cursor-pointer relative overflow-hidden ${snapshot.isDragging ? 'shadow-2xl ring-4 ring-indigo-500/10 rotate-2' : ''}`}
                                    onClick={() => {
                                      setSelectedTask(item);
                                      setShowTaskModal(true);
                                    }}
                                  >
                                    {coverUrl && (
                                      <div className="w-full h-36 overflow-hidden border-b border-base/50 bg-main">
                                        <img 
                                          src={coverUrl} 
                                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                          alt="" 
                                          onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                      </div>
                                    )}
                                    
                                    <div className="p-4 space-y-4">
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                           <div className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-current opacity-70 ${
                                              item.priority === 'Urgent' ? 'text-rose-600 bg-rose-50' : 
                                              item.priority === 'High' ? 'text-amber-600 bg-amber-50' : 
                                              'text-emerald-600 bg-emerald-50'
                                           }`}>
                                              {item.priority}
                                           </div>
                                        </div>
                                        <h4 className="text-[14px] font-bold text-primary leading-snug group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                                      </div>

                                      <div className="flex items-center gap-3 text-slate-400">
                                        {item.dueDate && (
                                          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border ${new Date(item.dueDate) < new Date() ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-main border-base text-secondary'}`}>
                                            <Clock size={12} />
                                            <span>{new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                          </div>
                                        )}
                                        
                                        <div className="flex items-center gap-2.5">
                                           {item.comments?.length > 0 && (
                                             <div className="flex items-center gap-1">
                                               <MessageSquare size={13} />
                                               <span className="text-[11px] font-bold">{item.comments.length}</span>
                                             </div>
                                           )}

                                           {total > 0 && (
                                             <div className={`flex items-center gap-1 ${completed === total ? 'text-emerald-500' : ''}`}>
                                               <CheckSquare size={13} />
                                               <span className="text-[11px] font-bold">{completed}/{total}</span>
                                             </div>
                                           )}
                                        </div>

                                        <div className="flex-1" />

                                        {item.assignedTo && (
                                          <div className="w-7 h-7 rounded-full bg-main border border-base flex items-center justify-center overflow-hidden shrink-0 group-hover:ring-2 ring-indigo-500/20 transition-all" title={typeof item.assignedTo === 'object' ? item.assignedTo?.name : 'User'}>
                                            {typeof item.assignedTo === 'object' && item.assignedTo?.profilePhoto ? (
                                              <img src={`http://localhost:5000${item.assignedTo.profilePhoto}`} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                              <span className="text-[10px] font-black text-secondary">
                                                {typeof item.assignedTo === 'object' ? item.assignedTo?.name?.charAt(0) : "U"}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>

                    <div className="p-3 shrink-0">
                      {addingCardTo === columnId ? (
                        <div className="bg-card p-4 rounded-2xl shadow-xl border border-indigo-500/30 animate-in zoom-in-95 duration-200">
                          <textarea
                            autoFocus
                            className="w-full bg-transparent border-none text-[13px] text-primary placeholder:text-slate-400 outline-none resize-none mb-4 font-medium"
                            placeholder="What's the task?"
                            rows={2}
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                createTask(columnId);
                              }
                              if (e.key === "Escape") setAddingCardTo(null);
                            }}
                          />
                          <div className="flex items-center gap-2">
                             <button onClick={() => createTask(columnId)} className="flex-1 bg-slate-900 dark:bg-indigo-600 text-white py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-md">Add</button>
                             <button onClick={() => setAddingCardTo(null)} className="p-2 text-secondary hover:bg-main rounded-xl transition-all"><X size={18} /></button>
                          </div>
                        </div>
                      ) : (
                        <button
                            onClick={() => setAddingCardTo(columnId)}
                            className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl text-secondary hover:bg-white dark:hover:bg-slate-800 hover:text-primary hover:shadow-sm border border-transparent hover:border-base transition-all text-xs font-bold uppercase tracking-widest"
                        >
                            <PlusIcon size={16} />
                            <span>Add Task</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="w-80 shrink-0">
                  {showAddList ? (
                      <div className="bg-card p-4 rounded-2xl shadow-xl border border-base animate-in blur-in-0 duration-200">
                          <input
                              autoFocus
                              className="w-full bg-main border border-base rounded-xl p-3 text-sm text-primary placeholder:text-slate-400 outline-none mb-4 font-bold"
                              placeholder="List Title"
                              value={newListTitle}
                              onChange={(e) => setNewListTitle(e.target.value)}
                              onKeyDown={(e) => {
                                  if (e.key === "Enter") addList();
                                  if (e.key === "Escape") setShowAddList(false);
                              }}
                          />
                          <div className="flex items-center gap-2">
                              <button onClick={addList} className="flex-1 bg-slate-900 dark:bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 shadow-md">Create List</button>
                              <button onClick={() => setShowAddList(false)} className="p-2 text-secondary hover:bg-main rounded-xl transition-all"><X size={18} /></button>
                          </div>
                      </div>
                  ) : (
                      <button 
                          onClick={() => setShowAddList(true)}
                          className="w-full p-4 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-base hover:border-indigo-500/30 hover:bg-card text-secondary hover:text-primary font-bold text-xs uppercase tracking-widest transition-all group"
                      >
                          <Plus size={18} className="group-hover:scale-110 transition-transform" />
                          <span>Add New List</span>
                      </button>
                  )}
                </div>
              </div>
            </DragDropContext>
          ) : activeTab === 'analytics' ? (
            <div className="p-12 space-y-12 animate-in fade-in duration-500">
                {!selectedProjectId ? (
                  <div className="flex flex-col items-center justify-center p-20 bg-card/20 rounded-[3rem] border-2 border-dashed border-base">
                    <BarChart3 size={64} className="text-secondary opacity-20 mb-6" />
                    <h3 className="text-xl font-black text-primary tracking-tight">Global Workspace Analytics</h3>
                    <p className="text-sm font-medium text-secondary mt-2">Select a specific project from the workspace to view detailed velocity and metrics.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                      {[
                        { label: "Completion Rate", value: `${projectStats.completionRate}%`, color: "text-indigo-600", bg: "bg-indigo-500/10", icon: CheckSquare },
                        { label: "Todo Tasks", value: projectStats.todo, color: "text-amber-600", bg: "bg-amber-500/10", icon: Clock },
                        { label: "In Progress", value: projectStats.doing, color: "text-blue-600", bg: "bg-blue-500/10", icon: BarChart3 },
                        { label: "Resolved", value: projectStats.completed, color: "text-emerald-600", bg: "bg-emerald-500/10", icon: PlusIcon },
                      ].map((stat, i) => (
                        <div key={i} className="bg-card p-8 rounded-[2rem] border border-base shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all">
                           <div className="relative z-10">
                              <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6`}>
                                 <stat.icon size={24} />
                              </div>
                              <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                              <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                           </div>
                           <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                             <stat.icon size={120} />
                           </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-card border border-base rounded-[3rem] p-12 shadow-sm">
                       <div className="flex items-center justify-between mb-12">
                          <div>
                            <h3 className="text-xl font-black text-primary tracking-tight mb-2">Project Velocity</h3>
                            <p className="text-sm font-medium text-secondary">High-level overview of task distribution across the workspace.</p>
                          </div>
                          <button className="px-6 py-3 bg-main border border-base rounded-2xl text-[10px] font-black uppercase tracking-widest text-secondary hover:text-indigo-600 transition-all">Export Hub Data</button>
                       </div>
                       
                       <div className="space-y-10">
                          {[
                            { label: 'Unstarted', count: projectStats.todo, color: 'bg-amber-500' },
                            { label: 'Active', count: projectStats.doing, color: 'bg-indigo-500' },
                            { label: 'Resolved', count: projectStats.completed, color: 'bg-emerald-500' },
                          ].map((item) => (
                            <div key={item.label} className="space-y-4">
                               <div className="flex justify-between items-end">
                                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary">{item.label} tasks</span>
                                  <span className="text-sm font-black text-primary">{item.count}</span>
                               </div>
                               <div className="h-4 w-full bg-main rounded-2xl overflow-hidden border border-base relative">
                                  <div 
                                    className={`h-full ${item.color} transition-all duration-1000 shadow-lg`} 
                                    style={{ width: `${projectStats.total ? (item.count / projectStats.total) * 100 : 0}%` }} 
                                  />
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  </>
                )}
            </div>
          ) : (
            <div className="p-12 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {users.map((user) => (
                    <div key={user._id} className="bg-card border border-base rounded-[2.5rem] p-8 flex items-center gap-6 group hover:shadow-2xl transition-all relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] -mr-16 -mt-16" />
                       <div className="w-16 h-16 rounded-3xl bg-main border border-base flex items-center justify-center text-2xl font-black text-secondary group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner relative z-10">
                          {user.profilePhoto ? <img src={`http://localhost:5000${user.profilePhoto}`} className="w-full h-full object-cover rounded-3xl" /> : user.name.charAt(0)}
                       </div>
                       <div className="relative z-10">
                          <h4 className="text-lg font-black text-primary truncate tracking-tight uppercase group-hover:text-indigo-600 transition-all">{user.name}</h4>
                          <p className="text-xs font-bold text-secondary opacity-60 truncate">{user.email}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      )}

      {showTaskModal && (
        <TaskModal
          task={selectedTask}
          onClose={() => { setShowTaskModal(false); setSelectedTask(null); }}
          onUpdate={fetchTasks}
          users={users}
          projects={projects}
        />
      )}
    </div>
  );
};

export default TaskBoard;
