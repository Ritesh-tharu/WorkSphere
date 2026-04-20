import React, { useState } from "react";
import axios from "axios";
import {
  Paperclip,
  X,
  Download,
  Image,
  FileText,
  File,
  Archive,
  Trash2,
  Upload,
  Share2,
} from "lucide-react";

const TaskAttachments = ({ taskId, attachments, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const token = localStorage.getItem("token");

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith("image/")) return <Image size={18} className="text-emerald-500" />;
    if (mimeType?.includes("pdf")) return <FileText size={18} className="text-rose-500" />;
    if (mimeType?.includes("zip") || mimeType?.includes("rar")) return <Archive size={18} className="text-amber-500" />;
    return <File size={18} className="text-slate-400" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const formData = new FormData();
    files.forEach((file) => formData.append("attachments", file));
    setUploading(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/uploads/task/${taskId}`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        onUploadProgress: (p) => setUploadProgress(Math.round((p.loaded * 100) / p.total)),
      });
      onUpdate([...(attachments || []), ...res.data.attachments]);
    } catch (error) { console.error(error); } finally { setUploading(false); }
  };

  const handleDelete = async (aid) => {
    if (!window.confirm("Delete this attachment?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/uploads/task/${taskId}/${aid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onUpdate(attachments.filter((a) => a._id !== aid));
    } catch (error) { console.error(error); }
  };

  const handleDownload = async (a) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/uploads/task/${taskId}/${a._id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", a.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) { console.error(error); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Paperclip size={14} className="text-slate-400" />
           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Legacy Files ({attachments?.length || 0})</span>
        </div>
        <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-bold cursor-pointer transition-all shadow-sm uppercase tracking-widest">
          <Upload size={12} strokeWidth={3} />
          <span>Upload</span>
          <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
        </label>
      </div>

      {uploading && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 animate-pulse">
          <div className="flex justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase">Synchronizing Data…</span>
            <span className="text-[10px] font-bold text-slate-900">{uploadProgress}%</span>
          </div>
          <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
             <div className="h-full bg-slate-900 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        {attachments?.map((a) => (
          <div key={a._id} className="group flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shrink-0">
              {getFileIcon(a.mimeType)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{a.originalName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{formatFileSize(a.size)}</span>
                <span className="w-1 h-1 rounded-full bg-slate-200" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{new Date(a.uploadedAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => handleDownload(a)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl"><Download size={14} /></button>
              <button onClick={() => handleDelete(a._id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}

        {(!attachments || attachments.length === 0) && (
          <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-100 rounded-2xl opacity-40">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No data uplinks established</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskAttachments;