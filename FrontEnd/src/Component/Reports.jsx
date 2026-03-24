import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Target,
  CheckCircle2,
  Clock,
  Activity,
  PieChart,
  TrendingUp,
  Download,
  FileText,
  ChevronDown,
  Filter,
} from "lucide-react";

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("week");
  const [selectedProject, setSelectedProject] = useState("all");
  const [projects, setProjects] = useState([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchProjects();
    fetchReportData();
    fetchForecastData();
  }, [dateRange, selectedProject]);

  const fetchProjects = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(res.data);
    } catch (error) { console.error(error); }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/reports/productivity?range=${dateRange}${selectedProject !== "all" ? `&projectId=${selectedProject}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReportData(res.data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const fetchForecastData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/reports/forecast", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForecastData(res.data);
    } catch (error) { console.error(error); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">Project Analytics</h1>
          <p className="text-sm font-medium text-slate-400">High-fidelity performance metrics and predictive mission intelligence.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-sm hover:bg-slate-50">
            <Download size={14} /> Export Intel
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md hover:bg-slate-800">
            <FileText size={14} /> Briefing
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center gap-6 shadow-sm">
        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
           {['week', 'month', 'quarter'].map(r => (
             <button 
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${dateRange === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
             >
                {r}
             </button>
           ))}
        </div>
        <div className="relative">
           <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
           <select 
             value={selectedProject}
             onChange={e => setSelectedProject(e.target.value)}
             className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest focus:ring-2 focus:ring-slate-900/5 outline-none appearance-none"
           >
              <option value="all">Global Sector</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
           </select>
           <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
        </div>
      </div>

      {loading ? (
         <div className="py-24 flex flex-col items-center justify-center space-y-4 opacity-40">
           <div className="w-8 h-8 border-3 border-slate-900 border-t-white rounded-full animate-spin" />
           <p className="text-[10px] font-bold uppercase tracking-widest">Computing Analytics Matrix…</p>
         </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-1">
            {[
              { label: "Stability Index", value: `${reportData?.summary?.productivityScore || 0}%`, sub: "Performance rating", icon: Target, color: "text-indigo-600 bg-indigo-50" },
              { label: "Resolved Nodes", value: reportData?.summary?.completedTasks || 0, sub: `${reportData?.summary?.totalTasks || 0} total units`, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
              { label: "Mission Velocity", value: `${reportData?.summary?.avgCompletionTime || 0}h`, sub: "Avg. lead time", icon: Clock, color: "text-amber-600 bg-amber-50" },
              { label: "Operational Hubs", value: projects.length, sub: "Active project sectors", icon: Activity, color: "text-purple-600 bg-purple-50" },
            ].map((stat, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm group hover:shadow-md transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border border-slate-100 ${stat.color}`}>
                  <stat.icon size={18} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-1">{stat.value}</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                <p className="text-[10px] text-slate-500 font-medium">{stat.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-1">
             <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-8">
                <div className="flex items-center gap-2">
                   <PieChart className="text-slate-400" size={16} />
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Criticality Distribution</h3>
                </div>
                <div className="space-y-6">
                   {reportData?.priorityDistribution?.map((item) => (
                      <div key={item._id} className="space-y-2">
                         <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            <span>{item._id} Priority</span>
                            <span className="text-slate-900">{Math.round((item.count / reportData.summary.totalTasks) * 100)}%</span>
                         </div>
                         <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                            <div 
                               className="h-full transition-all duration-700"
                               style={{ 
                                  width: `${(item.count / reportData.summary.totalTasks) * 100}%`,
                                  backgroundColor: item._id === "High" ? "#ef4444" : item._id === "Medium" ? "#f59e0b" : "#10b981"
                               }}
                            />
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {forecastData && (
                <div className="bg-slate-900 rounded-2xl p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-white">
                      <TrendingUp size={120} />
                   </div>
                   <div className="space-y-6 relative z-10">
                      <div className="flex items-center gap-2">
                         <TrendingUp className="text-indigo-400" size={16} />
                         <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Predictive Intelligence</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-center">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Cycle Horizon</p>
                            <p className="text-xl font-bold text-white">{forecastData.forecast.estimatedWeeks} Weeks</p>
                         </div>
                         <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-center">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Weekly Output</p>
                            <p className="text-xl font-bold text-white">{forecastData.forecast.avgWeeklyCompletion}</p>
                         </div>
                      </div>
                   </div>
                   
                   <div className="mt-8 pt-8 border-t border-slate-800 text-center relative z-10">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Projected Deployment Date</p>
                      <p className="text-2xl font-black text-white tracking-tight">
                         {new Date(forecastData.forecast.estimatedCompletionDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                   </div>
                </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
