import React, { useState, useEffect } from "react";
import axios from "axios";
import { Users, CheckCircle2, ChevronRight, Trash2, Bell, MessageSquare, AlertCircle, Mail, Clock } from "lucide-react";
import {
  BellIcon,
  ChatBubbleLeftEllipsisIcon,
  ExclamationCircleIcon,
  EnvelopeIcon,
  ClockIcon,
  CheckBadgeIcon,
  TrashIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

const NotificationsCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(notifications.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch (error) { console.error(error); }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put("http://localhost:5000/api/notifications/mark-all-read", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    } catch (error) { console.error(error); }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(notifications.filter((n) => n._id !== id));
    } catch (error) { console.error(error); }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "task": return CheckCircle2;
      case "comment": return ChatBubbleLeftEllipsisIcon;
      case "deadline": return ExclamationCircleIcon;
      case "invitation": return EnvelopeIcon;
      case "reminder": return ClockIcon;
      case "team": return Users;
      default: return BellIcon;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "task": return "text-indigo-600 bg-indigo-50";
      case "comment": return "text-sky-600 bg-sky-50";
      case "deadline": return "text-amber-600 bg-amber-50";
      case "invitation": return "text-purple-600 bg-purple-50";
      case "reminder": return "text-emerald-600 bg-emerald-50";
      case "team": return "text-rose-600 bg-rose-50";
      default: return "text-slate-600 bg-slate-50";
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread" && n.read) return false;
    if (filter === "read" && !n.read) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className=" p-8 mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">Notifications</h1>
          <p className="text-sm font-medium text-slate-400">Stay informed about tactical updates and team communications.</p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              <CheckBadgeIcon className="w-3.5 h-3.5" /> Clear Unread
            </button>
          )}
          <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
            {['all', 'unread'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 px-1">
        <div className="lg:col-span-3 space-y-3">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4 opacity-40">
              <div className="w-8 h-8 border-3 border-slate-900 border-t-white rounded-full animate-spin" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Scanning Signal Center…</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((n) => {
                const Icon = getNotificationIcon(n.type);
                const colorClasses = getNotificationColor(n.type);
                return (
                  <div key={n._id} className={`bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-4 group transition-all relative overflow-hidden shadow-sm ${!n.read ? 'border-l-4 border-l-slate-900' : 'opacity-80 hover:opacity-100'}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 ${colorClasses}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <h4 className="text-sm font-bold text-slate-900 truncate pr-4">{n.title}</h4>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter shrink-0">{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed mb-3">{n.message}</p>
                      <div className="flex items-center gap-3">
                        {!n.read && (
                          <button onClick={() => markAsRead(n._id)} className="text-[10px] font-bold uppercase tracking-widest text-slate-900 hover:underline flex items-center gap-1">
                            Mark Read <ChevronRightIcon className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <button onClick={() => deleteNotification(n._id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-600 transition-all shrink-0">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              {!filteredNotifications.length && (
                <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl opacity-40 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Horizon is clear</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Pending Signals</span>
                <span className="text-lg font-bold text-slate-900">{unreadCount}</span>
              </div>
              <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-900" style={{ width: `${Math.min(100, (unreadCount / 10) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsCenter;