import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, CheckCircle2, Info, AlertCircle, HelpCircle } from "lucide-react";

export default function CustomDialog({
  isOpen,
  onClose,
  title = "Notification",
  message = "",
  type = "info", // info, success, warning, danger, confirm
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
}) {
  // Get icon and color scheme based on type
  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          icon: <AlertTriangle className="w-8 h-8 text-rose-500 animate-pulse" />,
          glowClass: "bg-rose-500/10 shadow-rose-500/20",
          borderClass: "border-rose-500/30",
          bgGlow: "bg-rose-500/10",
          btnConfirmClass: "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/30 hover:shadow-rose-600/40",
          titleClass: "from-rose-200 via-red-200 to-orange-200",
        };
      case "success":
        return {
          icon: <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-bounce" />,
          glowClass: "bg-emerald-500/10 shadow-emerald-500/20",
          borderClass: "border-emerald-500/30",
          bgGlow: "bg-emerald-500/10",
          btnConfirmClass: "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30 hover:shadow-emerald-600/40",
          titleClass: "from-emerald-200 via-teal-200 to-cyan-200",
        };
      case "warning":
        return {
          icon: <AlertCircle className="w-8 h-8 text-amber-500" />,
          glowClass: "bg-amber-500/10 shadow-amber-500/20",
          borderClass: "border-amber-500/30",
          bgGlow: "bg-amber-500/10",
          btnConfirmClass: "bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 shadow-amber-600/30 hover:shadow-amber-600/40",
          titleClass: "from-amber-200 via-yellow-200 to-orange-200",
        };
      case "confirm":
        return {
          icon: <HelpCircle className="w-8 h-8 text-indigo-500" />,
          glowClass: "bg-indigo-500/10 shadow-indigo-500/20",
          borderClass: "border-indigo-500/30",
          bgGlow: "bg-indigo-500/10",
          btnConfirmClass: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-indigo-600/30 hover:shadow-indigo-600/40",
          titleClass: "from-blue-200 via-indigo-200 to-purple-200",
        };
      case "info":
      default:
        return {
          icon: <Info className="w-8 h-8 text-sky-500" />,
          glowClass: "bg-sky-500/10 shadow-sky-500/20",
          borderClass: "border-sky-500/30",
          bgGlow: "bg-sky-500/10",
          btnConfirmClass: "bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 shadow-sky-600/30 hover:shadow-sky-600/40",
          titleClass: "from-sky-200 via-blue-200 to-indigo-200",
        };
    }
  };

  const styles = getTypeStyles();
  const isConfirmDialog = type === "confirm" || type === "danger";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
          {/* Backdrop with premium blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
            className={`relative bg-[#0f172a]/95 border ${styles.borderClass} rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl backdrop-blur-xl p-8 text-center text-white`}
          >
            {/* Ambient background glows */}
            <div className={`absolute -top-12 -left-12 w-40 h-40 ${styles.bgGlow} rounded-full blur-3xl pointer-events-none`} />
            <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-slate-800/20 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon Banner */}
            <div className={`mx-auto w-16 h-16 ${styles.glowClass} border border-white/5 rounded-2xl flex items-center justify-center shadow-lg mb-6`}>
              {styles.icon}
            </div>

            {/* Title */}
            <h3 className={`text-lg font-black tracking-widest bg-gradient-to-r ${styles.titleClass} bg-clip-text text-transparent mb-3 uppercase tracking-[0.15em]`}>
              {title}
            </h3>

            {/* Message */}
            <p className="text-slate-300 text-sm font-medium leading-relaxed mb-8 px-2 whitespace-pre-line">
              {message}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  if (onConfirm) {
                    onConfirm();
                  } else {
                    onClose();
                  }
                }}
                className={`w-full py-4 ${styles.btnConfirmClass} text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2`}
              >
                {confirmText}
              </button>

              {isConfirmDialog && (
                <button
                  onClick={onClose}
                  className="w-full py-3.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all"
                >
                  {cancelText}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
