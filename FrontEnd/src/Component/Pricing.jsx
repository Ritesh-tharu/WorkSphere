import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const Pricing = () => {
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      name: 'Free',
      price: '0',
      description: 'Perfect for individuals and small teams starting out.',
      features: [
        'Up to 3 active projects',
        'Up to 5 team members per project',
        'Basic Task Management',
        'Calendar View',
        'Notifications',
      ],
      notIncluded: [
        'Unlimited Projects',
        'Unlimited Team Members',
        'Priority Support',
        'Advanced Analytics',
      ],
      buttonText: 'Current Plan',
      isPremium: false,
    },
    {
      name: 'Premium',
      price: '10',
      period: '/month',
      description: 'Advanced features for growing teams and complex projects.',
      features: [
        'Unlimited Projects',
        'Unlimited Team Members',
        'Priority Support',
        'Advanced Analytics',
        'Custom Project Themes',
        'Everything in Free',
      ],
      notIncluded: [],
      buttonText: 'Upgrade with eSewa',
      isPremium: true,
      popular: true,
    },
  ];

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_BASE_URL}/api/payments/initiate`, 
        { amount: 10 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const { url, formData } = response.data;
        
        // Create a form and submit it to eSewa
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = url;

        for (const key in formData) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = formData[key];
          form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-4"
          >
            Simple, Transparent Pricing
          </motion.h1>
          <p className="text-slate-400 text-lg">Choose the plan that's right for your team.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-8 rounded-3xl border ${
                plan.popular 
                  ? 'border-blue-500 bg-blue-500/5 shadow-[0_0_40px_rgba(59,130,246,0.1)]' 
                  : 'border-slate-800 bg-slate-900/50'
              } backdrop-blur-xl transition-all hover:scale-[1.02]`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5">
                  <SparklesIcon className="w-3.5 h-3.5" />
                  MOST POPULAR
                </div>
              )}

              <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold">NPR {plan.price}</span>
                {plan.period && <span className="text-slate-400">{plan.period}</span>}
              </div>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                {plan.description}
              </p>

              <div className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="mt-1 p-0.5 rounded-full bg-blue-500/20 text-blue-400">
                      <CheckIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-slate-300 text-sm">{feature}</span>
                  </div>
                ))}
                {plan.notIncluded.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 opacity-40">
                    <div className="mt-1 p-0.5 rounded-full bg-slate-800 text-slate-500">
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-slate-500 text-sm line-through">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                disabled={loading || !plan.isPremium}
                onClick={plan.isPremium ? handleUpgrade : undefined}
                className={`w-full py-4 rounded-xl font-bold transition-all ${
                  plan.isPremium
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 active:scale-95 disabled:opacity-50'
                    : 'bg-slate-800 text-slate-400 cursor-default'
                }`}
              >
                {loading ? 'Processing...' : plan.buttonText}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center text-slate-500 text-sm">
          <p>Secure payment processing by eSewa</p>
          <div className="flex justify-center gap-4 mt-4 grayscale opacity-50">
             <img src="https://esewa.com.np/common/images/esewa_logo.png" alt="eSewa" className="h-8 object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;