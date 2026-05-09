import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Calendar, 
  LayoutDashboard, 
  Rocket, 
  Code, 
  Mail, 
  Map, 
  Waypoints,
  Settings,
  ChevronRight,
  Sparkles,
  Menu,
  X,
  Search,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { cn } from './lib/utils';
import { UserRole } from './types';

// Pages - I'll implement these in separate files or as internal components
import AlumniConnect from './pages/AlumniConnect';
import EventModule from './pages/EventModule';
import InstitutionDashboard from './pages/InstitutionDashboard';
import StartupRadar from './pages/StartupRadar';
import BuildToApply from './pages/BuildToApply';
import ColdEmailForge from './pages/ColdEmailForge';
import CopyTheirPath from './pages/CopyTheirPath';
import SkillBridge from './pages/SkillBridge';

import AlumniDashboard from './pages/AlumniDashboard';

export default function App() {
  const [role, setRole] = useState<UserRole>('student');
  const [activeTab, setActiveTab] = useState('Alumni Connect');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [selectedStartup, setSelectedStartup] = useState<any>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectStartup = (startup: any) => {
    setSelectedStartup(startup);
    setActiveTab('Build to Apply');
  };

  const navItems = [
    { name: 'Alumni Connect', icon: Users, alumniOnly: false },
    { name: 'Event Module', icon: Calendar, alumniOnly: false },
    { name: 'Alumni Vault', icon: ShieldCheck, alumniOnly: false },
    { name: 'Institution Dashboard', icon: LayoutDashboard, alumniOnly: true },
    { name: 'Startup Radar', icon: Rocket, alumniOnly: false },
    { name: 'Build to Apply', icon: Code, alumniOnly: false },
    { name: 'Cold Email Forge', icon: Mail, alumniOnly: false },
    { name: 'Copy Their Path', icon: Map, alumniOnly: false },
    { name: 'Skill Bridge', icon: Waypoints, alumniOnly: false },
  ];

  const filteredNavItems = navItems.filter(item => !item.alumniOnly || role === 'alumni');

  return (
    <div className="flex min-h-screen bg-bg-primary text-text-body font-sans overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] bg-[#0D0D0D] border-r border-accent-muted/20 transition-transform duration-300 ease-in-out lg:translate-x-0",
          !isSidebarOpen && "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full py-8 px-6 relative overflow-hidden">
          <div className="sidebar-ornament" />
          <div className="mb-12 relative z-10">
            <h1 className="text-accent-cream font-display text-4xl font-light tracking-[0.2em] italic engraved-text">AlumNetwork.</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] opacity-40 mt-2 font-sc">Vera Amicitia Sempiterna</p>
          </div>

          <nav className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
            <div className="space-y-4">
              <p className="text-[9px] uppercase tracking-[0.4em] text-accent-warm mb-4 font-sc">Core Systems</p>
              {filteredNavItems.filter(item => ['Alumni Connect', 'Event Module', 'Institution Dashboard', 'Alumni Vault'].includes(item.name)).map((item) => (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 transition-all group relative",
                    activeTab === item.name 
                      ? "text-accent-cream" 
                      : "text-text-body/60 hover:text-accent-cream"
                  )}
                >
                  {activeTab === item.name && (
                    <motion.div 
                      layoutId="sidebar-active-bar"
                      className="absolute left-0 w-0.5 h-4 bg-accent-warm"
                    />
                  )}
                  <span className="text-xs font-medium tracking-widest font-sc">{item.name}</span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-accent-muted/30 to-transparent mb-6"></div>
              <p className="text-[9px] uppercase tracking-[0.4em] text-accent-warm mb-4 font-sc">Accelerators</p>
              {filteredNavItems.filter(item => !['Alumni Connect', 'Event Module', 'Institution Dashboard', 'Alumni Vault'].includes(item.name)).map((item) => (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 transition-all group relative",
                    activeTab === item.name 
                      ? "text-accent-cream" 
                      : "text-text-body/60 hover:text-accent-cream"
                  )}
                >
                  {activeTab === item.name && (
                    <motion.div 
                      layoutId="sidebar-active-bar"
                      className="absolute left-0 w-0.5 h-4 bg-accent-warm"
                    />
                  )}
                  <span className="text-xs font-medium tracking-widest font-sc">{item.name}</span>
                </button>
              ))}
            </div>
          </nav>

          <div className="mt-auto flex items-center gap-3 pt-6 border-t border-accent-muted/20">
            <div className="w-8 h-8 rounded-full bg-bg-secondary border border-accent-warm/30 flex items-center justify-center text-[10px] text-accent-cream font-mono">
              {role === 'student' ? 'JV' : 'EV'}
            </div>
            <div className="flex flex-col">
              <span className="text-accent-cream text-xs font-heading">{role === 'student' ? 'Julian Valois' : 'Eleanor Vance'}</span>
              <span className="text-[9px] uppercase tracking-wider opacity-50 font-sc">{role === 'student' ? "Class of '26" : "Class of '16"}</span>
            </div>
            <Settings className="w-3 h-3 ml-auto text-accent-muted cursor-pointer hover:text-accent-warm transition-colors" strokeWidth={1} />
          </div>
        </div>

        {/* Sidebar Decoration - Placeholder for oil painting asset */}
        <div className="absolute bottom-0 right-0 pointer-events-none opacity-20 grayscale hover:grayscale-0 transition-all duration-700">
           {/* We can use a public domain image here if requested, or just an ornament */}
           <div className="w-32 h-32 bg-gradient-to-tr from-accent-burgundy/20 to-transparent blur-3xl" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-[280px] min-h-screen relative flex flex-col">
        {/* Decorative Floral Background */}
        <div className="hero-floral" />
        
        {/* Decorative Background Text */}
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] pointer-events-none opacity-10 filter grayscale contrast-125 mix-blend-lighten z-0 overflow-hidden">
          <div className="absolute bottom-0 right-0 p-12 text-[140px] font-display italic leading-none text-accent-muted select-none">FLOREAT</div>
          <div className="absolute inset-0 bg-gradient-to-tr from-accent-burgundy/20 to-transparent blur-3xl" />
        </div>

        {/* Header */}
        <header className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-md border-b border-accent-muted/10 px-12 py-12 pb-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <p className="text-[11px] uppercase tracking-[0.5em] text-accent-warm mb-2 font-sc">The Collective Intelligence</p>
                <h2 className="text-accent-cream font-display text-7xl font-light leading-none">
                  Alumni <span className="italic font-normal">Connect</span>
                </h2>
                <div className="flex items-center gap-4 mt-3">
                  <p className="text-[10px] uppercase tracking-[0.3em] opacity-40 font-heading italic">Silentium et Decorum Est</p>
                  <div className="flex items-center gap-6 ml-8">
                    <button 
                      onClick={() => setRole('student')}
                      className={cn(
                        "relative py-1 text-[10px] uppercase tracking-[0.2em] transition-colors font-sc",
                        role === 'student' ? "text-accent-warm" : "text-accent-muted hover:text-accent-cream"
                      )}
                    >
                      Student
                      {role === 'student' && (
                        <motion.div layoutId="role-underline" className="absolute -bottom-1 left-0 right-0 h-px bg-accent-warm" />
                      )}
                    </button>
                    <button 
                      onClick={() => setRole('alumni')}
                      className={cn(
                        "relative py-1 text-[10px] uppercase tracking-[0.2em] transition-colors font-sc",
                        role === 'alumni' ? "text-accent-warm" : "text-accent-muted hover:text-accent-cream"
                      )}
                    >
                      Alumni
                      {role === 'alumni' && (
                        <motion.div layoutId="role-underline" className="absolute -bottom-1 left-0 right-0 h-px bg-accent-warm" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsSearchOpen(true)}
                  className="px-4 py-2 bg-white/5 border border-accent-cream/10 backdrop-blur-md text-accent-cream text-[10px] uppercase tracking-widest font-sc hover:bg-white/10 transition-colors"
                >
                  Search Nexus
                </button>
                <button 
                  onClick={() => setIsFilterOpen(true)}
                  className="px-4 py-2 border border-accent-warm/50 text-accent-warm text-[10px] uppercase tracking-widest font-sc hover:bg-accent-warm hover:text-bg-primary transition-all"
                >
                  Apply Filters
                </button>
                <button 
                  className="lg:hidden p-2 text-accent-cream"
                  onClick={() => setSidebarOpen(!isSidebarOpen)}
                >
                  {isSidebarOpen ? <X /> : <Menu />}
                </button>
              </div>
            </div>
            <div className="w-full h-px bg-gradient-to-r from-accent-warm/50 via-accent-muted/20 to-transparent" />
          </div>
        </header>

        {/* Content Area */}
        <div className="p-12 pt-6 max-w-7xl mx-auto flex-1 relative z-10 mb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + role}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8, ease: "circOut" }}
              className="relative"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Global Footer Status Bar */}
        <footer className="fixed bottom-0 right-0 left-[280px] z-30 bg-bg-primary/95 backdrop-blur-lg border-t border-accent-muted/10 px-12 py-6 hidden lg:block overflow-hidden">
           <div className="absolute inset-0 card-texture opacity-30 pointer-events-none" />
           <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
              <div className="flex items-center gap-12">
                 <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-warm animate-pulse shadow-[0_0_8px_rgba(196,149,106,1)]" />
                    <span className="text-[10px] uppercase font-sc tracking-[0.4em] text-accent-muted">Network Active</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase font-sc tracking-[0.4em] text-accent-muted">Nodes: <span className="text-accent-cream font-mono">1,427</span></span>
                 </div>
                 <div className="flex items-center gap-3 border-l border-accent-muted/20 pl-12 ml-4">
                    <span className="text-[10px] uppercase font-sc tracking-[0.4em] text-accent-muted">Connections: <span className="text-accent-cream font-mono">8.9k</span></span>
                 </div>
              </div>
              <div className="flex items-center gap-8 text-[11px] font-display italic text-accent-muted opacity-60">
                 "Vera amicitia sempiterna est."
                 <div className="w-8 h-8 rounded-full border border-accent-warm/20 flex items-center justify-center text-[10px] text-accent-warm not-italic font-mono">✦</div>
              </div>
           </div>
        </footer>
      </main>

      {/* Search Nexus Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-bg-primary/95 backdrop-blur-xl flex flex-col items-center pt-[15vh] px-6"
          >
            <button 
              onClick={() => setIsSearchOpen(false)}
              className="absolute top-12 right-12 text-accent-muted hover:text-accent-cream transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="w-full max-w-3xl space-y-12">
               <div className="space-y-4 text-center">
                  <p className="small-caps text-accent-warm">Intelligence Retrieval</p>
                  <h2 className="text-6xl font-display italic text-accent-cream">Search Nexus</h2>
               </div>

               <div className="relative">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-accent-muted" />
                  <input 
                    autoFocus
                    placeholder="Search alumni, startups, or domains..."
                    className="w-full bg-white/[0.03] border border-accent-muted/20 py-8 pl-16 pr-8 text-2xl font-heading text-accent-cream focus:outline-none focus:border-accent-warm transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>

               {searchQuery && (
                 <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="grid grid-cols-1 gap-4"
                 >
                    {[
                      { t: 'Alumni', n: 'Julian Blackwood', d: 'Distributed Systems Lead @ Cloudflare' },
                      { t: 'Startup', n: 'Aether Cloud', d: 'Serverless Infrastructure • Seed' },
                      { t: 'Path', n: 'Kernel Development', d: 'Vera Amicitia Sempiterna' }
                    ].map((res, i) => (
                      <div key={i} className="glass-card p-6 flex items-center justify-between hover:bg-white/[0.05] cursor-pointer group">
                         <div>
                            <p className="text-[10px] font-mono text-accent-warm uppercase mb-1">{res.t}</p>
                            <h4 className="text-xl font-heading text-accent-cream group-hover:text-accent-warm transition-colors">{res.n}</h4>
                            <p className="text-xs text-accent-muted mt-1">{res.d}</p>
                         </div>
                         <ChevronRight className="w-5 h-5 text-accent-muted group-hover:translate-x-2 transition-transform" />
                      </div>
                    ))}
                 </motion.div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters Overlay */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-[100] w-full max-w-md bg-[#0D0D0B] border-l border-accent-muted/20 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] p-12 flex flex-col"
          >
             <div className="flex justify-between items-center mb-16">
                <h3 className="text-2xl font-heading text-accent-cream">Filters</h3>
                <button onClick={() => setIsFilterOpen(false)} className="text-accent-muted hover:text-accent-cream transition-colors">
                   <X className="w-6 h-6" />
                </button>
             </div>

             <div className="flex-1 space-y-12">
                <div className="space-y-6">
                   <p className="small-caps text-accent-warm text-[10px]">Domain Architecture</p>
                   {['Machine Learning', 'Systems Design', 'Hardware', 'Product Research'].map(f => (
                     <label key={f} className="flex items-center gap-4 cursor-pointer group">
                        <div className="w-4 h-4 border border-accent-muted/30 group-hover:border-accent-warm transition-colors" />
                        <span className="text-xs font-sc tracking-widest text-accent-cream uppercase group-hover:text-accent-warm transition-colors">{f}</span>
                     </label>
                   ))}
                </div>

                <div className="space-y-6">
                   <p className="small-caps text-accent-warm text-[10px]">Batch Heritage</p>
                   <div className="grid grid-cols-2 gap-4">
                      {['2010-2015', '2016-2020', '2021-2024'].map(b => (
                        <button key={b} className="px-3 py-2 border border-accent-muted/20 text-[10px] font-mono text-accent-muted hover:border-accent-warm hover:text-accent-cream transition-all">
                           {b}
                        </button>
                      ))}
                   </div>
                </div>
             </div>

             <button className="w-full py-4 bg-accent-warm text-bg-primary font-sc text-[12px] tracking-[0.2em] font-bold hover:bg-accent-cream transition-all">
                APPLY CONSTRICTORS
             </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  function renderContent() {
    switch (activeTab) {
      case 'Alumni Connect': return <AlumniConnect role={role} />;
      case 'Event Module': return <EventModule />;
      case 'Alumni Vault': return <AlumniDashboard />;
      case 'Institution Dashboard': return <InstitutionDashboard />;
      case 'Startup Radar': return <StartupRadar onSelectStartup={handleSelectStartup} />;
      case 'Build to Apply': return <BuildToApply initialStartup={selectedStartup} />;
      case 'Cold Email Forge': return <ColdEmailForge />;
      case 'Copy Their Path': return <CopyTheirPath />;
      case 'Skill Bridge': return <SkillBridge />;
      default: return null;
    }
  }
}
