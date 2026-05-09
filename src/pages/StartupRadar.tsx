import { useState, useEffect } from 'react';
import { Search, Filter, Rocket, Star, ExternalLink, Zap } from 'lucide-react';
import { fetchStartups } from '../lib/api';
import { Startup } from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function StartupRadar({ onSelectStartup }: { onSelectStartup: (startup: any) => void }) {
  const [filterConnection, setFilterConnection] = useState(false);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStartups = async () => {
      try {
        const data = await fetchStartups();
        setStartups(data);
      } catch (err) {
        console.error("Failed to fetch startups", err);
      } finally {
        setLoading(false);
      }
    };
    loadStartups();
  }, []);

  const displayedStartups = filterConnection 
    ? startups.filter(s => s.alumniConnections > 0) 
    : startups;

  return (
    <div className="space-y-12">
      <header className="pt-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-7xl font-display italic text-accent-cream leading-[0.7]">Radar</h2>
            <p className="small-caps text-accent-muted text-xs mt-2">Emerging Ventures Intelligence</p>
          </div>
          
          <div className="flex items-center gap-4 glass-card p-2">
            <button 
              onClick={() => setFilterConnection(!filterConnection)}
              className={cn(
                "px-4 py-2 text-[10px] font-sc tracking-widest transition-all",
                filterConnection ? "bg-accent-warm text-bg-primary" : "text-accent-muted hover:text-accent-cream"
              )}
            >
              ALUMNI CONNECTION
            </button>
            <div className="w-px h-4 bg-accent-muted/20" />
            <button className="px-4 py-2 text-[10px] font-sc tracking-widest text-accent-muted hover:text-accent-cream">
              RECENTLY ADDED
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayedStartups.map((startup, i) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            key={startup.id}
            className={cn(
               "glass-card p-8 group relative overflow-hidden",
               startup.alumniConnections > 3 && "border-accent-warm/30 shadow-[0_0_30px_rgba(196,149,106,0.05)]"
            )}
          >
            {/* Background Accent */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-accent-warm/5 blur-3xl rounded-full" />
            
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 bg-bg-secondary border border-accent-muted/20 flex items-center justify-center">
                <Rocket className="w-6 h-6 text-accent-muted group-hover:text-accent-warm transition-colors" strokeWidth={1} />
              </div>
              <span className="font-mono text-[10px] text-accent-warm tracking-[0.2em]">{startup.stage.toUpperCase()}</span>
            </div>

            <h3 className="text-3xl font-heading text-accent-cream mb-2 group-hover:text-accent-warm transition-colors">{startup.name}</h3>
            <p className="text-[10px] font-sc text-accent-muted tracking-[0.3em] uppercase mb-6">{startup.domain}</p>
            
            <div className="space-y-4 mb-8">
               <div className="flex items-center gap-2">
                 <Zap className="w-3 h-3 text-accent-warm" />
                 <span className="text-[10px] font-mono text-text-body">{startup.techStack.join(' // ')}</span>
               </div>
               {startup.alumniConnections > 0 && (
                 <div className="p-3 bg-accent-warm/5 border border-accent-warm/20 rounded-[2px] flex items-center gap-3">
                   <div className="flex -space-x-2">
                      {[1,2,3].map(j => (
                        <div key={j} className="w-6 h-6 rounded-full border border-bg-primary bg-accent-muted overflow-hidden">
                          <img 
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=A${j}&backgroundColor=C4956A`} 
                            alt="avatar" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ))}
                   </div>
                   <span className="text-[9px] font-sc text-accent-warm">{startup.alumniConnections} ALUMNI CONNECTED</span>
                 </div>
               )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="py-3 border border-accent-muted/20 text-accent-muted font-sc text-[9px] tracking-widest hover:border-accent-cream hover:text-accent-cream transition-all">
                WAITLIST
              </button>
              <button 
                onClick={() => onSelectStartup(startup)}
                className="py-3 bg-accent-cream text-bg-primary font-sc text-[9px] tracking-widest hover:bg-accent-warm transition-all"
              >
                BUILD TO APPLY
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
