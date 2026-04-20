import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircleIcon } from '@heroicons/react/24/outline';

const PaymentFailure = () => {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 text-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full p-8 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-xl text-center"
      >
        <div className="space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 10 }}
            className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto"
          >
            <XCircleIcon className="w-12 h-12" />
          </motion.div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Payment Cancelled</h2>
            <p className="text-slate-400">Your payment was not completed. No charges were made.</p>
            <div className="pt-8 flex flex-col gap-3">
              <Link 
                to="/pricing" 
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all"
              >
                Return to Pricing
              </Link>
              <Link 
                to="/dashboard" 
                className="text-slate-500 hover:text-slate-400 text-sm font-medium"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentFailure;