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
} from "lucide-react";
import TaskModal from "./TaskModal";

const columnTemplate = {
  todo: { name: "To-do", items: [], color: "bg-slate-400" },
  doing: { name: "In progress", items: [], color: "bg-amber-400" },
  completed: { name: "Done", items: [], color: "bg-emerald-400" },
};

const priorityColors = {
  Low: "text-emerald-600 bg-emerald-50",
  Medium: "text-amber-600 bg-amber-50",
  High: "text-rose-600 bg-rose-50",
  Urgent: "text-purple-600 bg-purple-50",
};

const TaskBoard = () => {
  const [columns, setColumns] = useState(columnTemplate);
  const [addingCardTo, setAddingCardTo] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);

  const token = localStorage.getItem("token");

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchTasks(), fetchUsers(), fetchProjects()]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    const res = await axios.get("http://localhost:5000/api/tasks", getHeaders());
    const newCols = {
      todo: { ...columnTemplate.todo, items: [] },
      doing: { ...columnTemplate.doing, items: [] },
      completed: { ...columnTemplate.completed, items: [] },
    };
    const sortedTasks = res.data.sort((a, b) => (a.position || 0) - (b.position || 0));
    sortedTasks.forEach((task) => {
      if (!task.isArchived && newCols[task.status]) {
        newCols[task.status].items.push(task);
      }
    });
    setColumns(newCols);
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

  const getUserById = (userId) => users.find((u) => u._id === userId) || null;

  return (
    <div className="flex-1 overflow-x-auto h-full flex gap-4 items-start no-scrollbar border-t border-slate-100 bg-[#F9FAFB]/50">
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 opacity-40">
           <div className="w-10 h-10 border-4 border-slate-900 border-t-white rounded-full animate-spin" />
           <p className="text-sm font-bold tracking-widest uppercase">Syncing Core Board…</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          {Object.entries(columns).map(([id, col]) => (
            <div key={id} className="w-80 shrink-0 flex flex-col max-h-full bg-slate-50/50 rounded-2xl border border-slate-200 shadow-sm relative mr-2">
              {/* Column Header */}
              <div className="p-4 flex justify-between items-center bg-white/40 border-b border-slate-100 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full border border-white ring-2 ring-slate-100 ${col.color}`} />
                  <h2 className="font-bold text-slate-800 text-sm">{col.name}</h2>
                  <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full text-slate-400 border border-slate-100 shadow-xs">
                    {col.items.length}
                  </span>
                </div>
                <button className="text-slate-300 hover:text-slate-600 transition-colors">
                  <MoreHorizontal size={18} />
                </button>
              </div>

              {/* Cards Container */}
              <Droppable droppableId={id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar min-h-[100px]"
                  >
                    {col.items.map((task, index) => {
                      const assignee = getUserById(task.assignedTo);
                      return (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => { setSelectedTask(task); setShowTaskModal(true); }}
                              className={`group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer select-none ${snapshot.isDragging ? 'shadow-xl rotate-1 scale-[1.03] border-slate-300 z-50' : ''}`}
                            >
                              <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-xl text-[10px] font-bold uppercase tracking-tight ${priorityColors[task.priority] || priorityColors.Medium}`}>
                                    <Flag size={10} fill="currentColor" />
                                    {task.priority}
                                  </div>
                                  <div className="px-2 py-1 rounded-xl text-[10px] font-bold text-sky-600 bg-sky-50 uppercase tracking-tight border border-sky-100">
                                    Q4
                                  </div>
                                </div>
                                
                                <h3 className="font-bold text-base text-slate-800 leading-snug break-words group-hover:text-black transition-colors">
                                  {task.title}
                                </h3>
                                
                                {task.description && (
                                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                    {task.description}
                                  </p>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-slate-50 group-hover:border-slate-100 transition-colors">
                                   <div className="flex items-center gap-2">
                                      <div className="flex -space-x-2">
                                         {[1,2].map(i => (
                                           <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">?</div>
                                         ))}
                                         <button className="w-7 h-7 rounded-full border-2 border-white bg-white flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all">
                                            <PlusIcon size={12} strokeWidth={3} />
                                         </button>
                                      </div>
                                   </div>
                                   
                                   <div className="flex items-center gap-3 text-slate-300">
                                      {task.comments?.length > 0 && (
                                        <div className="flex items-center gap-1">
                                           <MessageSquare size={14} />
                                           <span className="text-[10px] font-bold">{task.comments.length}</span>
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
                    
                    {/* Inline Add Task Button */}
                    {addingCardTo === id ? (
                      <div className="bg-white rounded-2xl p-4 border border-slate-300 shadow-lg animate-in zoom-in-95 duration-200">
                        <textarea
                          autoFocus
                          className="w-full bg-transparent border-none text-sm text-slate-800 placeholder:text-slate-400 focus:ring-0 p-0 resize-none min-h-[40px] font-medium"
                          placeholder="Task title..."
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); createTask(id); }
                            if (e.key === "Escape") setAddingCardTo(null);
                          }}
                        />
                        <div className="flex items-center gap-2 mt-3">
                          <button onClick={() => createTask(id)} className="px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-xl uppercase tracking-widest">Add</button>
                          <button onClick={() => setAddingCardTo(null)} className="p-1.5 text-slate-400 hover:text-slate-600 transition-all"><X size={16} /></button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setAddingCardTo(id)}
                        className="w-full flex items-center gap-2 py-3 px-4 text-slate-400 hover:text-slate-900 hover:bg-white/50 rounded-2xl transition-all font-bold text-xs group/add"
                      >
                        <PlusIcon size={14} strokeWidth={3} className="group-hover/add:scale-110 transition-transform" />
                        <span>New task</span>
                      </button>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </DragDropContext>
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
