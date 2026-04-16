import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Layout, 
  ChevronRight, 
  CheckCircle2, 
  Globe, 
  Layers, 
  Users, 
  ShieldCheck,
  Menu,
  X,
  Play,
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  MessageSquare,
  Globe2,
  Lock,
  BarChart3
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [email, setEmail] = useState("");

  const handleSignup = (e) => {
    e.preventDefault();
    navigate("/signup", { state: { initialEmail: email } });
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div id="home" className="min-h-screen bg-[#FDFDFD] text-[#1D1D1F] font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      {/* Header */}
      <nav className="fixed top-0 w-full z-[100] bg-white/70 backdrop-blur-xl border-b border-slate-100/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link 
              to="/" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform duration-300">
                <Layout className="text-white" size={22} />
              </div>
              <span className="text-2xl font-black tracking-tighter text-[#1D1D1F] uppercase italic">WorkSphere</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-10">
              {["Home", "Features", "Policy", "Terms & Condition", "Contact"].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`} className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">{item}</a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-6">
               <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors uppercase tracking-widest">Login</Link>
               <Link to="/signup" className="px-8 py-3.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all active:scale-95 leading-none">
                 Sign Up
               </Link>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-slate-100 overflow-hidden"
            >
              <div className="flex flex-col p-6 gap-6">
                {["Home", "Features", "Policy", "Terms & Condition", "Contact"].map((item) => (
                  <a 
                    key={item} 
                    href={`#${item.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`} 
                    onClick={() => setIsMenuOpen(false)}
                    className="text-sm font-black text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-[0.2em]"
                  >
                    {item}
                  </a>
                ))}
                <div className="h-[1px] bg-slate-100 w-full" />
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Login</Link>
                <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="w-full py-4 bg-indigo-600 text-white text-center font-black text-xs uppercase tracking-[0.3em] rounded-xl">
                   Get Started
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 lg:pt-56 lg:pb-40 text-center overflow-visible">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
           <motion.div 
             initial="initial"
             animate="animate"
             variants={stagger}
             className="space-y-10"
           >
              <motion.h1 
                variants={fadeInUp}
                className="text-6xl md:text-8xl font-black text-[#1D1D1F] tracking-tight leading-[0.9] max-w-5xl mx-auto"
              >
                Effortless task <br />
                management, <span className="text-amber-500 text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">anytime</span>
              </motion.h1>

              <motion.p 
                variants={fadeInUp}
                className="text-lg md:text-xl text-slate-500 font-bold max-w-2xl mx-auto leading-relaxed uppercase tracking-widest opacity-70"
              >
                Manage tasks and projects easily with an all-in-one platform designed for seamless collaboration.
              </motion.p>
           </motion.div>

           {/* Hero Mockup - Single Aesthetic Version */}
           <div className="relative mt-20 lg:mt-32 max-w-5xl mx-auto px-4 lg:px-0">
              <motion.div 
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
                className="relative z-10 rounded-[2rem] border border-slate-200/40 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] overflow-hidden bg-white group perspective-1000"
              >
                <motion.div
                  whileHover={{ scale: 1.02, rotateX: 2, rotateY: -2 }}
                  transition={{ duration: 0.8 }}
                  className="relative cursor-none"
                >
                  <img 
                    src="/assets/aesthetic-mockup.png" 
                    className="w-full h-auto object-cover" 
                    alt="WorkSphere Aesthetic Dashboard" 
                  />
                  {/* Glassy overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                </motion.div>
              </motion.div>

              {/* Decorative Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] bg-indigo-100/30 rounded-full blur-[160px] -z-10" />
           </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-20 border-y border-slate-100 bg-[#FDFDFD]">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center mb-12">We are trusted by</p>
          <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-24 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
             {["Trello", "Jira",  "Monday"].map((brand) => (
                <span key={brand} className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">{brand}</span>
             ))}
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="py-32 lg:py-48 px-6 lg:px-12 bg-[#F8F9FA]/30">
        <div className="max-w-7xl mx-auto">
           <div className="text-center space-y-4 mb-24">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em]">Benefits</span>
              <h2 className="text-4xl lg:text-5xl font-black text-[#1D1D1F] tracking-tight">The smart choice for your team</h2>
              <p className="text-slate-500 font-bold max-w-2xl mx-auto uppercase tracking-widest text-xs opacity-60 leading-loose">Everything you need to simplify your projects, boost productivity, and keep your team aligned</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { 
                  title: "To-do List", 
                  desc: "Organize your daily tasks effortlessly with our intuitive to-do list.", 
                  icon: CheckCircle2, 
                  color: "bg-amber-50",
                  iconColor: "text-amber-600"
                },
                { 
                  title: "Team Member Tracking", 
                  desc: "Easily track your team members progress and stay connected in real-time.", 
                  icon: Users, 
                  color: "bg-indigo-50",
                  iconColor: "text-indigo-600"
                },
                { 
                  title: "Project Tracking", 
                  desc: "Monitor project timelines and milestones in real-time. Keep projects on track.", 
                  icon: BarChart3, 
                  color: "bg-rose-50",
                  iconColor: "text-rose-600"
                }
              ].map((feature, i) => (
                <motion.div 
                  key={feature.title}
                  whileHover={{ y: -10 }}
                  className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all"
                >
                   <div className={`w-14 h-14 ${feature.color} ${feature.iconColor} rounded-2xl flex items-center justify-center mb-8 shadow-sm`}>
                      <feature.icon size={28} />
                   </div>
                   <h3 className="text-xl font-black text-[#1D1D1F] mb-4 uppercase tracking-tight">{feature.title}</h3>
                   <p className="text-slate-500 font-medium leading-relaxed text-sm mb-8">{feature.desc}</p>
                   <div className="h-[200px] bg-slate-50 rounded-2xl border border-slate-100 mt-auto overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500/10 to-transparent p-6">
                         <div className="w-full h-4 bg-white rounded-full mb-3 shadow-[0_4px_12px_rgba(0,0,0,0.05)]" />
                         <div className="w-2/3 h-4 bg-white rounded-full mb-3 shadow-[0_4px_12px_rgba(0,0,0,0.05)]" />
                         <div className="w-1/2 h-4 bg-white rounded-full mb-3 shadow-[0_4px_12px_rgba(0,0,0,0.05)]" />
                      </div>
                   </div>
                </motion.div>
              ))}
           </div>
        </div>
      </section>



      {/* Testimonials */}
      <section className="py-32 lg:py-48 px-6 lg:px-12 bg-[#F8F9FA]/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 space-y-4">
             <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em]">Testimonials</span>
             <h2 className="text-4xl lg:text-5xl font-black text-[#1D1D1F] tracking-tight">What our users say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                text: "WorkSphere has completely changed how our team collaborates. Its intuitive and has made tracking projects so much easier.",
                author: "Sarah Thompson",
                role: "Product Manager",
                company: "Spotify"
              },
              { 
                text: "With WorkSphere, we've streamlined our workflow and met deadlines more consistently. The team chat feature is a game-changer!",
                author: "Alex Rivera",
                role: "Marketing Director",
                company: "DocuSign",
                active: true
              },
              { 
                text: "WorkSphere has helped us keep all our tasks in order. The interface is clean, and it makes managing multiple projects a breeze.",
                author: "David Lee",
                role: "Operations Director",
                company: "Codeacademy"
              }
            ].map((t) => (
              <div key={t.author} className={`p-10 rounded-[2.5rem] border border-slate-100 bg-white transition-all ${t.active ? 'shadow-2xl shadow-indigo-600/10 ring-1 ring-indigo-500' : 'shadow-sm'}`}>
                 <div className="flex gap-1 mb-8">
                   {[1, 2, 3, 4, 5].map((s) => <Sparkles key={s} size={14} className="text-amber-500 fill-amber-500" />)}
                 </div>
                 <p className="text-slate-600 font-medium leading-relaxed mb-10 italic">"{t.text}"</p>
                 <div className="flex items-center gap-4 pt-8 border-t border-slate-50">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400">
                       {t.author.charAt(0)}
                    </div>
                    <div>
                       <h5 className="text-sm font-black text-[#1D1D1F] uppercase tracking-wider">{t.author}</h5>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-60">{t.role} • {t.company}</p>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="bg-[#1D1D1F] py-24 px-6 lg:px-12 text-white overflow-hidden relative border-y border-white/10">
         <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-12 relative z-10">
            {[
              { value: "15,000+", label: "Projects managed with WorkSphere" },
              { value: "1,300+", label: "Teams collaborating daily" },
              { value: "150,000+", label: "Tasks completed with WorkSphere" },
              { value: "95%", label: "User satisfaction rate" }
            ].map((stat) => (
              <div key={stat.label} className="flex-1 min-w-[200px] space-y-3">
                 <h3 className="text-4xl lg:text-5xl font-black tracking-tighter">{stat.value}</h3>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 leading-relaxed max-w-[180px]">{stat.label}</p>
              </div>
            ))}
         </div>
         <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -mr-48 -mt-48" />
      </section>

      {/* Policy & Terms Sections */}
      <section id="policy" className="py-24 px-6 lg:px-12 bg-white border-b border-slate-100">
         <div className="max-w-4xl mx-auto space-y-12">
            <div className="space-y-4">
               <h2 className="text-3xl font-black text-[#1D1D1F] uppercase tracking-tight">Privacy Policy</h2>
               <div className="text-slate-500 font-medium leading-relaxed space-y-4 text-sm">
                  <p>Your privacy is important to us. It is WorkSphere's policy to respect your privacy regarding any information we may collect from you across our website and other sites we own and operate.</p>
                  <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.</p>
                  <p>We don’t share any personally identifying information publicly or with third-parties, except when required to by law.</p>
               </div>
            </div>
         </div>
      </section>

      <section id="terms-condition" className="py-24 px-6 lg:px-12 bg-[#F8F9FA]/30 border-b border-slate-100">
         <div className="max-w-4xl mx-auto space-y-12">
            <div className="space-y-4">
               <h2 className="text-3xl font-black text-[#1D1D1F] uppercase tracking-tight">Terms & Conditions</h2>
               <div className="text-slate-500 font-medium leading-relaxed space-y-4 text-sm">
                  <p>By accessing the website at WorkSphere, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>
                  <p>The materials on WorkSphere's website are provided on an 'as is' basis. WorkSphere makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
                  <p>In no event shall WorkSphere or its suppliers be liable for any damages arising out of the use or inability to use the materials on WorkSphere's website.</p>
               </div>
            </div>
         </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-6 lg:px-12 bg-white">
         <div className="max-w-4xl mx-auto text-center space-y-12">
            <div className="space-y-8">
               <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">Get in Touch</span>
               <h2 className="text-4xl lg:text-5xl font-black text-[#1D1D1F] tracking-tight">Let's talk about <br />your project</h2>
               <p className="text-slate-500 font-bold uppercase tracking-widest text-xs opacity-60 leading-loose mx-auto max-w-lg">Our team is here to help you optimize your workspace and boost your productivity.</p>
               
               <div className="flex flex-col md:flex-row justify-center items-center gap-12 pt-8">
                  <div className="flex items-center gap-6 group text-left">
                     <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                        <Globe2 size={24} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                        <p className="text-sm font-black text-[#1D1D1F]">Kupondole, Lalitpur, Nepal</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-6 group text-left">
                     <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                        <MessageSquare size={24} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Number</p>
                        <p className="text-sm font-black text-[#1D1D1F]">9821878726</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-white border-t border-slate-100">
         <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="flex justify-center items-center mb-20">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#1D1D1F] rounded-xl flex items-center justify-center">
                    <Layout className="text-white" size={20} />
                  </div>
                  <span className="text-2xl font-black tracking-tighter text-[#1D1D1F] uppercase italic">WorkSphere</span>
               </div>
               
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center pt-10 border-t border-slate-100 gap-6">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">© 2026 WorkSphere Collective. All rights reserved.</p>
               <div className="flex gap-8">
                  {["Policy", "Terms & Condition", "Twitter", "LinkedIn"].map((s) => (
                    <a key={s} href="#" className="text-[10px] font-black text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-[0.2em]">{s}</a>
                  ))}
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default Landing;
