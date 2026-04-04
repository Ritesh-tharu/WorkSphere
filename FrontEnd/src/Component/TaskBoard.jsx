import React, { useEffect, useState } from "react";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Plus,
  X,
  MoreHorizontal,
  CheckCircle2,
  Users,
  LayoutGrid,
  ChevronLeft,
  Search,
  CheckCircle
} from "lucide-react";
import {
  ChatBubbleLeftEllipsisIcon,
  ChartBarIcon,
  CalendarIcon,
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  Bars2Icon
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleIconSolid } from "@heroicons/react/24/solid";
import TaskModal from "./TaskModal";
import SearchFilters from "./SearchFilters";

const TaskBoard = ({ selectedProjectId, onBack, globalSearch }) => {
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

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  useEffect(() => {
    fetchInitialData();
  }, [selectedProjectId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Sequence: Fetch projects first to get column definitions, then fetch tasks that depend on them.
      const currentProjects = await fetchProjects();
      await Promise.all([
        fetchTasks(currentProjects), 
        fetchUsers(), 
        fetchProjectStats()
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActiveProject = () => {
    return projects.find(p => p._id === selectedProjectId);
  };

  const fetchProjectStats = async () => {
    // If no project selected, we don't fetch project-specific stats here.
    // The Dashboard component handles global stats.
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

  const fetchTasks = async (pList) => {
    try {
      setLoading(true);
      // Always include project filter in the request. If no project selected, fetch "null" (Global Workspace)
      const projectParam = selectedProjectId || "null";
      const url = `http://localhost:5000/api/tasks?project=${projectParam}`;
        
      const res = await axios.get(url, getHeaders());
      
      const activeProject = (pList || projects).find(p => p._id === selectedProjectId);
      const initialCols = {};
      
      if (activeProject && activeProject.columns && activeProject.columns.length > 0) {
          activeProject.columns
            .sort((a, b) => (a.position || 0) - (b.position || 0))
            .forEach(col => {
              initialCols[col.id] = { name: col.name, items: [] };
            });
      } else {
          initialCols.todo = { name: "To do", items: [] };
          initialCols.doing = { name: "Doing", items: [] };
          initialCols.completed = { name: "Done", items: [] };
      }

      const sortedTasks = res.data.sort((a, b) => (a.position || 0) - (b.position || 0));
      const colMap = { ...initialCols };
      
      sortedTasks.forEach(task => {
          const taskProjectId = task.project?._id || task.project;
          
          if (selectedProjectId) {
              if (taskProjectId?.toString() !== selectedProjectId.toString()) {
                  return;
              }
          } else {
              if (taskProjectId) {
                  return;
              }
          }

          if (!colMap[task.status]) {
              colMap[task.status] = { name: task.status.replace(/_/g, ' ').toUpperCase(), items: [] };
          }
          if (!task.isArchived) {
              colMap[task.status].items.push(task);
          }
      });

      setColumns(colMap);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
        // First get the global team members
        const res = await axios.get("http://localhost:5000/api/invitations/team", getHeaders());
        let team = res.data || [];
        
        // If a project is selected, we also want project-specific members (owner + project team)
        if (selectedProjectId && projects.length > 0) {
            const activeProj = projects.find(p => p._id === selectedProjectId);
            if (activeProj) {
                const projectMembers = [];
                if (activeProj.owner) projectMembers.push({ ...activeProj.owner, role: 'Owner' });
                if (activeProj.teamMembers) {
                    activeProj.teamMembers.forEach(m => {
                        if (!projectMembers.find(pm => pm._id === m._id)) {
                            projectMembers.push({ ...m, role: 'Member' });
                        }
                    });
                }
                setUsers(projectMembers);
                return;
            }
        }
        
        setUsers(team.map(u => ({ ...u, role: 'Member' })));
    } catch (e) { console.error(e); }
  };

  const fetchProjects = async () => {
    try {
        const res = await axios.get("http://localhost:5000/api/projects", getHeaders());
        setProjects(res.data);
        return res.data;
    } catch (e) { 
        console.error(e); 
        return [];
    }
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
      fetchProjectStats();
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const saveColumns = async (newCols) => {
    if (!selectedProjectId) return;
    try {
      const columnPayload = Object.entries(newCols).map(([id, col], index) => ({
        id,
        name: col.name,
        position: index
      }));
      await axios.put(`http://localhost:5000/api/projects/${selectedProjectId}/columns`, { columns: columnPayload }, getHeaders());
      // Refresh projects to keep columns in sync
      fetchProjects();
    } catch (e) {
      console.error("Error saving columns:", e);
    }
  };

  const addList = () => {
    if (!newListTitle.trim()) {
        setShowAddList(false);
        return;
    }
    const status = newListTitle.toLowerCase().replace(/\s/g, '_');
    const newCols = {
        ...columns,
        [status]: { name: newListTitle, items: [] }
    };
    setColumns(newCols);
    setNewListTitle("");
    setShowAddList(false);
    saveColumns(newCols);
  };

  const deleteList = async (columnId) => {
    const column = columns[columnId];
    if (!window.confirm(`Delete list "${column.name}"?`)) return;
    
    try {
      await Promise.all(column.items.map(item => axios.delete(`http://localhost:5000/api/tasks/${item._id}`, getHeaders())));
      const newCols = { ...columns };
      delete newCols[columnId];
      setColumns(newCols);
      setActiveMenuCol(null);
      saveColumns(newCols);
      fetchProjectStats();
    } catch (error) {
      console.error("Error deleting list:", error);
    }
  };

  const renameList = async (columnId) => {
    if (!tempColName.trim() || tempColName === columns[columnId].name) {
      setEditingCol(null);
      return;
    }
    const newStatus = tempColName.toLowerCase().replace(/\s/g, '_');
    try {
      // In Trello, renaming a list doesn't necessarily change the internal status slug of existing tasks 
      // but for this data model where status IS the column identifier, we must update tasks.
      await Promise.all(columns[columnId].items.map(item => 
        axios.put(`http://localhost:5000/api/tasks/${item._id}`, { status: newStatus }, getHeaders())
      ));
      
      const newCols = { ...columns };
      const items = newCols[columnId].items.map(it => ({ ...it, status: newStatus }));
      delete newCols[columnId];
      newCols[newStatus] = { name: tempColName, items };
      
      setColumns(newCols);
      setEditingCol(null);
      setActiveMenuCol(null);
      saveColumns(newCols);
    } catch (error) {
      console.error("Error renaming list:", error);
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination, type } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'COLUMN') {
      const columnEntries = Object.entries(columns);
      const [removed] = columnEntries.splice(source.index, 1);
      columnEntries.splice(destination.index, 0, removed);
      const newColumns = Object.fromEntries(columnEntries);
      setColumns(newColumns);
      saveColumns(newColumns);
      return;
    }

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
        fetchProjectStats();
      } catch (e) { fetchTasks(); }
    }
  };

  const handleSearchResults = (tasks) => {
    const activeProj = getActiveProject();
    const newColumns = {};
    
    // Initialize with project columns (persists structure even if no tasks found)
    if (activeProj?.columns?.length > 0) {
        activeProj.columns
          .sort((a, b) => (a.position || 0) - (b.position || 0))
          .forEach(col => {
            newColumns[col.id] = { name: col.name, items: [] };
          });
    } else {
        newColumns.todo = { name: "To do", items: [] };
        newColumns.doing = { name: "Doing", items: [] };
        newColumns.completed = { name: "Done", items: [] };
    }
    
    // Map tasks to columns
    tasks.forEach(task => {
      const status = task.status || 'todo';
      if (!newColumns[status]) {
          newColumns[status] = { name: status.replace(/_/g, ' ').toUpperCase(), items: [] };
      }
      if (!task.isArchived) {
          newColumns[status].items.push(task);
      }
    });

    setColumns(newColumns);
  };

  const activeProject = getActiveProject();

  return (
    <div className="flex-1 flex flex-col bg-white h-full overflow-hidden font-sans border-r border-slate-200">
      {/* HEADER */}
      <div className="px-8 py-5 flex items-center justify-between border-b border-slate-200 bg-white shadow-sm z-30 shrink-0">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-6">
            {onBack && (
              <button 
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 rounded-lg text-secondary hover:text-indigo-600 transition-all text-[10px] font-black uppercase tracking-widest border border-slate-200"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>workspace</span>
              </button>
            )}
            <div>
              <div className="flex items-center gap-3 mb-1">
                 <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeProject?.color || '#6366f1' }} />
                 <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                   {activeProject?.name || "Global Workspace"}
                 </h1>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase opacity-70">
                 <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {users.length} members</span>
                 <span className="flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" /> {projectStats.total} active tasks</span>
              </div>
            </div>
          </div>

          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
            {['board', 'analytics', 'team'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-500 hover:text-indigo-600'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
           <SearchFilters 
             onSearchResults={handleSearchResults} 
             initialFilters={{ project: selectedProjectId }} 
             globalSearch={globalSearch}
           />
           <button 
              onClick={() => {
                setSelectedTask({ 
                  title: "", 
                  status: "todo", 
                  priority: "Medium", 
                  project: selectedProjectId,
                  description: "",
                  labels: [],
                  checklist: [],
                  attachments: []
                });
                setShowTaskModal(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
           >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
           </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-white">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto custom-scrollbar relative bg-white">
          {activeTab === 'board' ? (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="board" type="COLUMN" direction="horizontal">
                {(provided) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex items-start gap-6 p-8 min-h-full"
                  >
                    {Object.entries(columns).map(([columnId, column], index) => (
                      <Draggable key={columnId} draggableId={columnId} index={index}>
                        {(provided) => (
                          <div 
                            {...provided.draggableProps}
                            ref={provided.innerRef}
                            className="w-80 shrink-0 flex flex-col h-full max-h-[calc(100vh-250px)] rounded-2xl bg-slate-50 border border-slate-200 group/list transition-all"
                          >
                            <div {...provided.dragHandleProps} className="p-5 pb-2 flex items-center justify-between cursor-grab active:cursor-grabbing">
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg uppercase tracking-[0.2em]">{column.items.length}</span>
                                {editingCol === columnId ? (
                                  <input 
                                    autoFocus
                                    className="bg-transparent border-none text-xs font-black text-slate-900 uppercase tracking-[0.15em] outline-none"
                                    value={tempColName}
                                    onChange={(e) => setTempColName(e.target.value)}
                                    onBlur={() => renameList(columnId)}
                                    onKeyDown={(e) => e.key === 'Enter' && renameList(columnId)}
                                  />
                                ) : (
                                  <h2 
                                    className="text-xs font-black text-slate-900 tracking-[0.15em] uppercase truncate"
                                    onClick={() => { setEditingCol(columnId); setTempColName(column.name); }}
                                  >
                                    {column.name}
                                  </h2>
                                )}
                              </div>
                              <button 
                                onClick={() => setActiveMenuCol(activeMenuCol === columnId ? null : columnId)}
                                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 opacity-0 group-hover/list:opacity-100 transition-all font-bold"
                              >
                                <MoreHorizontal className="w-5 h-5" />
                              </button>

                              {activeMenuCol === columnId && (
                                 <div className="absolute top-14 right-4 w-40 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 py-2">
                                    <button onClick={() => deleteList(columnId)} className="w-full text-left px-4 py-2 text-[10px] font-black text-rose-500 hover:bg-rose-50 uppercase tracking-widest">Delete List</button>
                                 </div>
                              )}
                            </div>

                            <Droppable droppableId={columnId} type="CARD">
                              {(provided, snapshot) => (
                                <div
                                  {...provided.droppableProps}
                                  ref={provided.innerRef}
                                  className={`flex-1 overflow-y-auto px-4 py-4 min-h-[150px] custom-scrollbar space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50/30' : ''}`}
                                >
                          {column.items.map((item, index) => {
                            const total = item.checklist?.length || 0;
                            const completed = item.checklist?.filter(c => c.completed).length || 0;
                            const coverAttachment = item.attachments?.find(a => a.mimeType?.startsWith('image/'));

                            return (
                              <Draggable key={item._id} draggableId={item._id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => { setSelectedTask(item); setShowTaskModal(true); }}
                                    className={`group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${snapshot.isDragging ? 'rotate-2 scale-105 shadow-xl ring-2 ring-indigo-500' : ''}`}
                                  >
                                    {coverAttachment && (
                                      <div className="h-32 w-full overflow-hidden border-b border-slate-200 bg-slate-100">
                                        <img src={`http://localhost:5000${coverAttachment.url}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                                      </div>
                                    )}

                                    <div className="p-4 space-y-3">
                                      <div className="flex flex-wrap gap-1.5 min-h-[4px]">
                                        {item.labels?.map((label, i) => (
                                          <div 
                                            key={i} 
                                            className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest text-white"
                                            style={{ backgroundColor: label.color }}
                                          >
                                            {label.text}
                                          </div>
                                        ))}
                                      </div>

                                      <h3 className="text-[13px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug tracking-tight">
                                        {item.title}
                                      </h3>

                                      <div className="flex items-center gap-3 text-slate-500 pt-1">
                                        {item.dueDate && (
                                          <div className={`flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded ${new Date(item.dueDate) < new Date() && item.status !== 'completed' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100'}`}>
                                            <Calendar className="w-3 h-3" />
                                            <span>{new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                          </div>
                                        )}
                                        
                                        <div className="flex items-center gap-3 opacity-60">
                                           {item.comments?.length > 0 && (
                                             <div className="flex items-center gap-1">
                                               <MessageSquare className="w-3.5 h-3.5" />
                                               <span className="text-[10px] font-black">{item.comments.length}</span>
                                             </div>
                                           )}
                                           {total > 0 && (
                                             <div className={`flex items-center gap-1 ${completed === total ? 'text-emerald-500 opacity-100' : ''}`}>
                                               <CheckCircle2 className="w-3.5 h-3.5" />
                                               <span className="text-[10px] font-black">{completed}/{total}</span>
                                             </div>
                                           )}
                                        </div>

                                        <div className="ml-auto">
                                           {item.assignedTo && (
                                             <div className="w-6 h-6 rounded-full border-2 border-white bg-indigo-500 flex items-center justify-center overflow-hidden shrink-0">
                                                {item.assignedTo.profilePhoto ? <img src={`http://localhost:5000${item.assignedTo.profilePhoto}`} className="w-full h-full object-cover" /> : <span className="text-[8px] font-black text-white">{item.assignedTo.name?.charAt(0)}</span>}
                                             </div>
                                           )}
                                        </div>
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
                        <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200 animate-in zoom-in-95 duration-200">
                          <textarea
                            autoFocus
                            className="w-full bg-transparent border-none text-xs text-slate-900 placeholder:text-slate-400 outline-none resize-none mb-3 font-bold"
                            placeholder="Task name"
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
                             <button onClick={() => createTask(columnId)} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-black text-[10px] uppercase tracking-widest">Add</button>
                             <button onClick={() => setAddingCardTo(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ) : (
                        <button
                            onClick={() => setAddingCardTo(columnId)}
                            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-slate-500 hover:bg-white hover:text-slate-900 transition-all text-[10px] font-black uppercase tracking-widest"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Task</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {showAddList ? (
              <div className="w-80 shrink-0 bg-slate-50 border border-slate-200 rounded-2xl p-4 animate-in zoom-in-95 duration-200 h-fit">
                <input
                  autoFocus
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none mb-3"
                  placeholder="Enter list title..."
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addList();
                    if (e.key === "Escape") setShowAddList(false);
                  }}
                />
                <div className="flex gap-2">
                  <button onClick={addList} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-black text-[10px] uppercase tracking-widest">Add List</button>
                  <button onClick={() => setShowAddList(false)} className="px-3 py-2 text-slate-400 hover:bg-slate-200 rounded-lg"><X className="w-4 h-4" /></button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setShowAddList(true)}
                className="w-80 shrink-0 p-5 flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-600/30 hover:bg-white text-slate-400 hover:text-indigo-600 font-black text-[10px] uppercase tracking-widest transition-all group h-fit mt-0"
              >
                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>New List</span>
              </button>
            )}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  ) : activeTab === 'analytics' ? (
             <div className="p-12 space-y-12 animate-in fade-in duration-500 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[
                      { label: "Completion Rate", value: `${projectStats.completionRate}%`, color: "text-indigo-600", bg: "bg-indigo-50", icon: CheckCircle2 },
                      { label: "In Progress", value: projectStats.doing, color: "text-blue-600", bg: "bg-blue-50", icon: Clock },
                      { label: "Done", value: projectStats.completed, color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2 },
                      { label: "Total Tasks", value: projectStats.total, color: "text-slate-600", bg: "bg-slate-100", icon: LayoutGrid }
                    ].map((stat, i) => (
                      <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                         <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6`}>
                            <stat.icon className="w-5 h-5" />
                         </div>
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                         <p className={`text-3xl font-black ${stat.color} tracking-tight`}>{stat.value}</p>
                      </div>
                    ))}
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-10">Task Distribution</h3>
                    <div className="space-y-10">
                       {[
                         { label: 'To do', count: projectStats.todo, color: 'bg-slate-400' },
                         { label: 'Doing', count: projectStats.doing, color: 'bg-indigo-600' },
                         { label: 'Done', count: projectStats.completed, color: 'bg-emerald-500' },
                       ].map((item) => (
                         <div key={item.label} className="space-y-4">
                            <div className="flex justify-between items-end">
                               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{item.label}</span>
                               <span className="text-xl font-black text-slate-900">{item.count}</span>
                            </div>
                            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                               <div 
                                 className={`h-full ${item.color} transition-all duration-1000`} 
                                 style={{ width: `${projectStats.total ? (item.count / projectStats.total) * 100 : 0}%` }} 
                               />
                            </div>
                         </div>
                       ))}
                    </div>
                </div>
             </div>
          ) : (
            <div className="p-12 animate-in fade-in duration-500 bg-white">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {users.map((user) => (
                    <div key={user._id} className="bg-white border border-slate-200 rounded-[2rem] p-8 flex items-center justify-between group hover:shadow-lg transition-all relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-700" />
                       
                       <div className="flex items-center gap-6 relative z-10">
                          <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center text-3xl font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all overflow-hidden shrink-0 shadow-sm">
                             {user.profilePhoto ? <img src={`http://localhost:5000${user.profilePhoto}`} className="w-full h-full object-cover" /> : user.name?.charAt(0)}
                          </div>
                          <div className="overflow-hidden">
                             <div className="flex items-center gap-3 mb-1">
                                <h4 className="text-lg font-black text-slate-900 truncate tracking-tight uppercase group-hover:text-indigo-600 transition-all">{user.name}</h4>
                                {user.role && (
                                   <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${user.role === 'Owner' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                      {user.role}
                                   </span>
                                )}
                             </div>
                             <p className="text-xs font-bold text-slate-500 opacity-60 truncate">{user.email}</p>
                             <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-3 opacity-0 group-hover:opacity-100 transition-all">View Profile</p>
                          </div>
                       </div>
                       
                       <button className="relative z-10 p-3 text-slate-400 hover:text-rose-500 transition-colors">
                          <EllipsisHorizontalIcon className="w-5 h-5" />
                       </button>
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
          onUpdate={() => { fetchTasks(); fetchProjectStats(); }}
          users={users}
          projects={projects}
        />
      )}
    </div>
  );
};

export default TaskBoard;
