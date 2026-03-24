import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  X,
  Clock,
} from "lucide-react";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    color: "#6366f1",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const res = await axios.get("http://localhost:5000/api/calendar", {
        params: { startDate: startOfMonth.toISOString(), endDate: endOfMonth.toISOString() },
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(res.data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const createEvent = async (e) => {
    e.preventDefault();
    try {
      const eventData = { ...newEvent, startDate: selectedDate || new Date(), endDate: newEvent.endDate || selectedDate || new Date() };
      const res = await axios.post("http://localhost:5000/api/calendar", eventData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents([res.data, ...events]);
      setShowEventModal(false);
      setNewEvent({ title: "", description: "", startDate: "", endDate: "", color: "#6366f1" });
    } catch (error) { console.error(error); }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
    return days;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const isToday = (date) => date && new Date().toDateString() === date.toDateString();

  const handleDateClick = (date) => {
    if (date) {
      setSelectedDate(date);
      setNewEvent({ ...newEvent, startDate: date.toISOString().split("T")[0], endDate: date.toISOString().split("T")[0] });
      setShowEventModal(true);
    }
  };

  const getEventsForDate = (date) => date ? events.filter(e => new Date(e.startDate).toDateString() === date.toDateString()) : [];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">Calendar</h1>
          <p className="text-sm font-medium text-slate-400">Track milestones and synchronize team deadlines.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-2">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 transition-all"><ChevronLeft size={18} /></button>
            <span className="text-sm font-bold text-slate-900 min-w-[120px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 transition-all"><ChevronRight size={18} /></button>
          </div>
          <button onClick={() => setShowEventModal(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all ml-2 shadow-sm">
            <Plus size={14} /> New Event
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 px-1">
        <div className="lg:col-span-3">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
              {dayNames.map(day => (
                <div key={day} className="py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{day}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7">
              {getDaysInMonth(currentDate).map((date, i) => {
                const dateEvents = getEventsForDate(date);
                return (
                  <div 
                    key={i} 
                    onClick={() => handleDateClick(date)}
                    className={`min-h-[120px] p-3 border-r border-b border-slate-100 transition-all cursor-pointer group hover:bg-slate-50/50 ${!date ? 'bg-slate-50/30' : ''}`}
                  >
                    {date && (
                      <div className="space-y-2">
                        <div className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-lg transition-all ${isToday(date) ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 group-hover:text-slate-900'}`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dateEvents.slice(0, 3).map(event => (
                            <div 
                              key={event._id}
                              className="px-2 py-1 rounded-md text-[9px] font-bold truncate flex items-center gap-1.5"
                              style={{ backgroundColor: `${event.color}15`, color: event.color }}
                            >
                               <div className="w-1 h-3 rounded-full shrink-0" style={{ backgroundColor: event.color }} />
                               {event.title}
                            </div>
                          ))}
                          {dateEvents.length > 3 && (
                            <div className="text-[9px] font-bold text-slate-400 pl-1">+{dateEvents.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Clock size={14} /> Upcoming Events
              </h3>
              <div className="space-y-6">
                 {events.slice(0, 5).map(event => (
                   <div key={event._id} className="relative pl-4 border-l-2 border-slate-100 space-y-1 group">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(event.startDate).toLocaleDateString()}</p>
                      <h4 className="text-xs font-bold text-slate-800 truncate">{event.title}</h4>
                      <p className="text-[10px] text-slate-400 font-medium truncate">{event.description || "No mission brief."}</p>
                   </div>
                 ))}
                 {!events.length && <p className="text-xs font-bold text-slate-300 uppercase tracking-widest text-center py-10">Static horizon.</p>}
              </div>
           </div>
        </div>
      </div>

      {showEventModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowEventModal(false)}>
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl p-8 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Schedule New Event</h2>
                <button onClick={() => setShowEventModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><X size={20} /></button>
             </div>
             <form onSubmit={createEvent} className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Event Title *</label>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all font-medium" placeholder="E.g. Strategy Alignment…" required value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Start Date</label>
                    <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all font-medium" value={newEvent.startDate} onChange={e => setNewEvent({...newEvent, startDate: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">End Date</label>
                    <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-slate-900/5 outline-none transition-all font-medium" value={newEvent.endDate} onChange={e => setNewEvent({...newEvent, endDate: e.target.value})} />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowEventModal(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all text-sm">Discard</button>
                  <button type="submit" className="flex-[2] py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md transition-all active:scale-95">Confirm event</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
