import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { motion } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const navigate = useNavigate();

  useEffect(() => {
    const verifyPayment = async () => {
      const data = searchParams.get('data');
      if (!data) {
        setStatus('error');
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/api/payments/verify?data=${data}`);
        if (response.data.success) {
          setStatus('success');
          // Update user info in local storage if needed, or just let the app re-fetch
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Verification failed:', error);
        setStatus('error');
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 text-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full p-8 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-xl text-center"
      >
        {status === 'verifying' && (
          <div className="space-y-4">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <h2 className="text-xl font-bold">Verifying Payment...</h2>
            <p className="text-slate-400">Please wait while we confirm your transaction with eSewa.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10 }}
              className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto"
            >
              <CheckCircleIcon className="w-12 h-12" />
            </motion.div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Payment Successful!</h2>
              <p className="text-slate-300">Welcome to Premium! Your account has been upgraded.</p>
              <p className="text-slate-400 text-sm mt-4">Redirecting to dashboard in 3 seconds...</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto text-4xl">
              ⚠️
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Verification Failed</h2>
              <p className="text-slate-400 text-sm">We couldn't verify your payment. If money was deducted, please contact support.</p>
              <div className="pt-6">
                 <Link to="/pricing" className="text-blue-400 hover:text-blue-300 underline font-medium">Try again</Link>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;