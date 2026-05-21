import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, AlertTriangle, ArrowRight } from "lucide-react";

export default function PremiumLimitModal({
  isOpen,
  onClose,
  title = "Premium Feature",
  message = "You have reached the limit for free accounts. Upgrade to Premium to unlock unlimited access!",
  onUpgrade = () => {
    window.location.href = "/pricing";
  },
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
          {/* Backdrop with blur */}
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
            transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
            className="relative bg-[#0f172a]/90 border border-indigo-500/30 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.25)] backdrop-blur-xl p-8 text-center text-white"
          >
            {/* Ambient background glows */}
            <div className="absolute -top-12 -left-12 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Sparkles Premium Banner */}
            <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>

            {/* Content */}
            <h3 className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 bg-clip-text text-transparent mb-3 uppercase text-[16px] tracking-[0.1em]">
              {title}
            </h3>
            <p className="text-slate-300 text-sm font-medium leading-relaxed mb-8 px-2">
              {message}
            </p>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={onUpgrade}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/35 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Upgrade to Premium</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onClose}
                className="w-full py-3.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all"
              >
                Maybe Later
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
