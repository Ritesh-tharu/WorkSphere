import React from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Play
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");

  const handleSignup = (e) => {
    e.preventDefault();
    navigate("/signup", { state: { initialEmail: email } });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-lg shadow-slate-900/10">
                <Layout className="text-white" size={18} />
              </div>
              <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">WorkSphere</span>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-100 p-4 space-y-4 animate-in slide-in-from-top-2">
            <a href="#features" className="block text-base font-semibold text-slate-600">Features</a>
            <a href="#solutions" className="block text-base font-semibold text-slate-600">Solutions</a>
            <div className="pt-4 flex flex-col gap-3">
              <Link to="/login" className="w-full py-3 text-center font-bold text-slate-600 border border-slate-200 rounded-xl">Log in</Link>
              <Link to="/signup" className="w-full py-3 text-center font-bold text-white bg-slate-900 rounded-xl">Join WorkSphere</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-48 sm:pb-32 overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-60 animate-pulse" />
          <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-slate-100 rounded-full blur-3xl opacity-60 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-[800px] space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <Activity size={12} className="text-slate-900" />
              <span>Unified Workspace v4.2 now live</span>
            </div>
            
            <h1 className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9] sm:leading-[0.85] animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Capture, organize, <br />
              and tackle your <br />
              <span className="text-slate-400">to-dos anywhere.</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-500 font-medium max-w-[540px] leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000">
              Escape the clutter and chaos—unleash your productivity with WorkSphere. The most intuitive workspace for modern teams.
            </p>

            <form onSubmit={handleSignup} className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="w-full sm:w-[400px] relative group">
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-6 pr-4 py-4 text-sm font-medium focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 focus:bg-white outline-none transition-all shadow-sm"
                  required
                />
                <button type="submit" className="hidden sm:block absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10">
                  Sign up - it's free!
                </button>
              </div>
              <button type="submit" className="w-full sm:hidden py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-900/10 active:scale-95">
                Sign up - it's free!
              </button>
              
              <button type="button" className="flex items-center gap-2 px-6 py-4 text-slate-600 hover:text-slate-900 font-bold transition-all group">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <Play fill="currentColor" size={14} className="ml-1" />
                </div>
                <span>Watch video</span>
              </button>
            </form>

            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-4">
              Trusted by 10,000+ teams worldwide
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Stats */}
      <section id="features" className="py-20 border-t border-slate-100 bg-slate-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Layers, title: "Layered Views", desc: "Organize tasks in boards, calendars, or lists." },
              { icon: Users, title: "Team Synergy", desc: "Collaborate in real-time with your entire crew." },
              { icon: ShieldCheck, title: "Enterprise Grade", desc: "Security and encryption you can trust." },
              { icon: Globe, title: "Global Sync", desc: "Access your workspace from any device, anywhere." }
            ].map((feature, i) => (
              <div key={i} className="space-y-4 hover:translate-y-[-4px] transition-transform duration-300">
                <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center text-slate-900">
                  <feature.icon size={22} />
                </div>
                <h3 className="font-bold text-slate-800">{feature.title}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 sm:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-[3rem] p-12 sm:p-20 text-center space-y-8 relative overflow-hidden shadow-2xl shadow-slate-900/20">
            {/* Background elements for dark section */}
            <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-white/5 rounded-full blur-3xl" />

            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tighter leading-none">
              Start doing, <br />
              <span className="text-slate-400 italic">stop managing.</span>
            </h2>
            <p className="text-slate-400 text-lg sm:text-xl font-medium max-w-[600px] mx-auto">
              Ready to take your team to the next level? Join thousands of teams using WorkSphere to get more done.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/signup" className="w-full sm:w-auto px-10 py-4 bg-white text-slate-900 font-black rounded-full hover:bg-slate-100 transition-all shadow-xl active:scale-95">
                Join for free
              </Link>
              <Link to="/login" className="w-full sm:w-auto px-10 py-4 border border-white/20 text-white font-black rounded-full hover:bg-white/10 transition-all">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-900 rounded-md flex items-center justify-center">
              <Layout className="text-white" size={14} />
            </div>
            <span className="text-sm font-black tracking-tighter text-slate-900 uppercase">WorkSphere</span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
            © 2026 WorkSphere Collective. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs font-bold text-slate-400 hover:text-slate-900 uppercase transition-colors">Privacy</a>
            <a href="#" className="text-xs font-bold text-slate-400 hover:text-slate-900 uppercase transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const Activity = ({ className, size }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

export default Landing;
