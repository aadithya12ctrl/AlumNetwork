import { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, GraduationCap, Star, ChevronRight } from 'lucide-react';
import { fetchAlumni } from '../lib/api';
import { Alumni, UserRole } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function AlumniConnect({ role }: { role: UserRole }) {
  const [search, setSearch] = useState('');
  const [alumniData, setAlumniData] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchAlumni();
        setAlumniData(data);
      } catch (err) {
        console.error("Failed to fetch alumni", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-16 py-12 relative">
      <header className="mb-24 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-accent-warm/50 to-transparent" />
        <div className="text-center pt-8">
          <p className="small-caps text-accent-warm mb-4 animate-pulse">The collective intelligence</p>
          <h1 className="text-8xl md:text-[120px] font-display text-accent-cream italic leading-none engraved-text">
            The <span className="not-italic font-light opacity-80">Directory</span>
          </h1>
          <div className="flex items-center justify-center gap-4 mt-8 opacity-40">
             <div className="w-12 h-px bg-accent-muted" />
             <span className="text-[10px] uppercase tracking-[0.5em] font-sc">vera amicitia sempiterna</span>
             <div className="w-12 h-px bg-accent-muted" />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {loading ? (
           <div className="col-span-3 text-center py-20 text-accent-muted font-mono tracking-widest text-xs animate-pulse">
             FETCHING NODES...
           </div>
        ) : alumniData.map((alumni, i) => (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.8 }}
            key={alumni.id}
            className="glass-card card-texture p-8 group cursor-pointer flex flex-col justify-between min-h-[400px] hover:-translate-y-2 transition-transform duration-500"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-4xl font-display italic">
              {alumni.batchYear}
            </div>
            
            <div>
              <div className="flex justify-between items-start mb-12">
                <div className="w-16 h-16 rounded-full border border-accent-warm/30 flex items-center justify-center bg-gradient-to-br from-[#111111] to-[#050505] shadow-2xl overflow-hidden group-hover:border-accent-warm transition-colors">
                   <span className="text-accent-warm font-mono text-lg">{alumni.avatarInitials}</span>
                </div>
                <div className="flex flex-col items-end">
                   <div className="flex items-center gap-2 mb-2 bg-accent-burgundy/10 px-3 py-1 border border-accent-burgundy/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-burgundy animate-pulse" />
                      <span className="text-[9px] uppercase tracking-widest text-accent-burgundy font-bold font-sc">Mentor</span>
                   </div>
                   {alumni.isOpenToRefer && (
                      <span className="text-[10px] text-accent-warm italic font-display opacity-60">Referral Open</span>
                   )}
                </div>
              </div>
              
              <h3 className="text-3xl font-heading text-accent-cream mb-2 group-hover:text-accent-warm transition-colors">{alumni.name}</h3>
              <p className="text-sm opacity-60 mb-8 font-sans italic">{alumni.role} @ {alumni.company}</p>
              
              <div className="flex flex-wrap gap-2 mb-8">
                {alumni.domain.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-white/5 border border-accent-muted/20 text-accent-cream text-[9px] uppercase tracking-widest font-sc">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-8 border-t border-accent-muted/10 flex justify-between items-center group/btn">
              <span className="text-[11px] font-mono opacity-30 uppercase tracking-[0.2em]">CLASS OF {alumni.batchYear}</span>
              <button className="text-[11px] text-accent-warm uppercase tracking-[0.3em] font-sc border-b border-accent-warm/0 hover:border-accent-warm/100 pb-1 transition-all flex items-center gap-2">
                Forge Request <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="section-divider" />

      <div className="h-24 flex items-center justify-between border-t border-accent-muted/20 px-2 opacity-60">
        <div className="flex items-center gap-12">
          <div>
            <p className="text-[28px] font-mono text-accent-cream">1.4k</p>
            <p className="text-[9px] uppercase tracking-[0.3em] opacity-40 font-sc">Global Nodes</p>
          </div>
          <div>
            <p className="text-[28px] font-mono text-accent-warm">84%</p>
            <p className="text-[9px] uppercase tracking-[0.3em] opacity-40 font-sc">Bridge Rate</p>
          </div>
          <div>
            <p className="text-[28px] font-mono text-accent-cream">127</p>
            <p className="text-[9px] uppercase tracking-[0.3em] opacity-40 font-sc">Active Forges</p>
          </div>
        </div>
        <div className="text-right opacity-40 font-heading italic text-xs hidden lg:block">
          "Knowledge is the bridge between eternity and the present."
        </div>
      </div>
    </div>
  );
}
