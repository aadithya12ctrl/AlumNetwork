import { useState, useRef, useEffect } from 'react';
import { Search as SearchIcon, ChevronRight } from 'lucide-react';
import { motion, useScroll } from 'motion/react';
import { cn } from '../lib/utils';
import { fetchAlumni, fetchStartups, traceAlumniPath } from '../lib/api';
import { Alumni, Startup } from '../types';

export default function CopyTheirPath() {
  const [alumniList, setAlumniList] = useState<Alumni[]>([]);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
  const [search, setSearch] = useState('');
  const timelineRef = useRef(null);
  
  const [traceData, setTraceData] = useState<any>(null);
  const [loadingTrace, setLoadingTrace] = useState(false);

  useEffect(() => {
    const init = async () => {
      const [alumniData, startupsData] = await Promise.all([
        fetchAlumni(), fetchStartups()
      ]);
      setAlumniList(alumniData);
      setStartups(startupsData);
      if (alumniData.length > 0) setSelectedAlumni(alumniData[0]);
    };
    init();
  }, []);

  useEffect(() => {
    const loadTrace = async () => {
      if (!selectedAlumni) return;
      setLoadingTrace(true);
      try {
        const trace = await traceAlumniPath('test-student', selectedAlumni.id);
        setTraceData(trace);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTrace(false);
      }
    };
    loadTrace();
  }, [selectedAlumni]);
  
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start center", "end end"]
  });

  const activePath = traceData?.path || [];

  return (
    <div className="flex flex-col lg:flex-row gap-8 pt-8 min-h-screen">
      {/* Left Selector Panel */}
      <aside className="w-full lg:w-[320px] space-y-6">
        <div className="space-y-4">
          <h2 className="text-4xl font-display italic text-accent-cream leading-tight">Tracing</h2>
          <p className="small-caps text-accent-muted text-[10px]">Mimicry of Greatness</p>
        </div>

        <div className="glass-card p-4 space-y-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-accent-muted" />
            <input 
              type="text" 
              placeholder="Search Alumni..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.02] border border-accent-muted/20 py-2 pl-10 pr-4 text-xs text-accent-cream focus:outline-none focus:border-accent-warm/50"
            />
          </div>
          
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {alumniList.map(alumni => (
              <button
                key={alumni.id}
                onClick={() => setSelectedAlumni(alumni)}
                className={cn(
                  "w-full text-left p-4 glass-card transition-all group",
                  selectedAlumni?.id === alumni.id ? "bg-accent-warm/5 border-accent-warm/30" : "hover:bg-white/[0.02] opacity-70"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-accent-muted/20 border border-accent-muted/30 flex items-center justify-center text-[10px] text-accent-cream font-mono">
                    {alumni.avatarInitials}
                  </div>
                  <div>
                    <h4 className="text-xs font-heading text-accent-cream">{alumni.name}</h4>
                    <p className="text-[9px] text-accent-muted font-mono">{alumni.batchYear}</p>
                  </div>
                </div>
                <p className="text-[9px] text-text-body/80 truncate mb-2">{alumni.role} @ {alumni.company}</p>
                <div className="flex gap-1 overflow-hidden">
                   {alumni.domain.slice(0, 2).map(d => (
                     <span key={d} className="text-[8px] font-sc text-accent-warm border border-accent-warm/20 px-1 py-0.5 whitespace-nowrap">{d}</span>
                   ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Right Timeline Panel */}
      <div className="flex-1 space-y-24" ref={timelineRef}>
        <div className="relative">
          {/* Animated Progress Line */}
          <div className="absolute left-10 lg:left-1/2 top-4 bottom-4 w-px bg-accent-muted/10 hidden md:block">
            <motion.div 
              style={{ scaleY: scrollYProgress }}
              className="w-full h-full bg-accent-warm origin-top"
            />
          </div>

          <div className="space-y-32">
            {loadingTrace ? (
              <div className="text-center py-20 text-accent-warm font-mono animate-pulse">TRACING CHRONICLES...</div>
            ) : activePath.map((node: any, i: number) => (
              <TimelineNode 
                key={node.year || i} 
                node={node} 
                index={i} 
                isLeft={i % 2 === 0} 
              />
            ))}
          </div>
        </div>

        {/* Compatibility Block */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="glass-card p-12 bg-accent-warm/5 border-accent-warm/20"
        >
          <div className="text-center space-y-8 mb-16">
            <div className="space-y-2">
              <p className="text-5xl font-display italic text-accent-cream">Convergence 78%</p>
              <p className="small-caps text-accent-muted text-xs tracking-[0.4em]">Compatibility with this path</p>
            </div>
            <div className="max-w-md mx-auto h-1.5 bg-bg-secondary border border-accent-muted/10 rounded-full overflow-hidden">
               <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: '78%' }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-accent-warm shadow-[0_0_20px_rgba(196,149,106,0.4)]"
               />
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-xl font-heading text-accent-cream border-l-2 border-accent-warm pl-4">Suggested Startups</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {startups.slice(0, 3).map(startup => (
                 <div key={startup.id} className="glass-card p-4 hover:border-accent-warm/30 transition-all cursor-pointer">
                    <h5 className="text-sm font-heading text-accent-cream mb-1">{startup.name}</h5>
                    <p className="text-[9px] font-sc text-accent-muted uppercase tracking-widest">{startup.domain}</p>
                    <div className="mt-4 flex items-center justify-between">
                       <span className="text-[8px] font-mono text-accent-warm">{startup.stage}</span>
                       <ChevronRight className="w-3 h-3 text-accent-warm" />
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function TimelineNode({ node, index, isLeft }: any) {
  const roman = ["I", "II", "III", "IV", "V"][index];
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ margin: "-100px" }}
      className={cn(
        "relative flex flex-col md:flex-row items-center gap-12",
        isLeft ? "md:flex-row" : "md:flex-row-reverse"
      )}
    >
      {/* Visual Ornament */}
      <div className="absolute left-[-40px] md:left-1/2 md:-translate-x-1/2 top-0 text-[180px] font-display italic text-accent-muted opacity-[0.05] leading-none pointer-events-none select-none">
        {roman}
      </div>

      <div className="w-full md:w-1/2 hidden md:block" />
      
      <div className="w-full md:w-1/2 z-10">
        <div className="glass-card card-texture p-0 group hover:border-accent-warm/40 transition-all duration-700 overflow-hidden">
           <div className="bg-accent-warm/5 px-8 py-6 border-b border-accent-warm/10 flex justify-between items-center">
              <p className="text-4xl font-mono text-accent-warm leading-none tracking-tighter">{node.year}</p>
              <div className="flex flex-wrap gap-2 justify-end">
                {node.skills.map(s => (
                  <span key={s} className="px-2 py-0.5 bg-accent-burgundy/20 border border-accent-burgundy/30 text-[8px] text-accent-cream font-sc tracking-widest uppercase">{s}</span>
                ))}
              </div>
           </div>
           
           <div className="p-8">
             <h4 className="text-2xl font-heading text-accent-cream mb-3 group-hover:text-accent-warm transition-colors">{node.title}</h4>
             <p className="text-base text-text-body/80 font-display leading-relaxed mb-8 italic">"{node.description}"</p>
             
             <div className="pt-6 border-t border-accent-muted/10 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-sc text-accent-muted uppercase tracking-[0.3em] mb-1">Key Artifact</p>
                  <p className="text-sm font-heading text-accent-cream italic">{node.projects}</p>
                </div>
                <div className="w-10 h-10 rounded-full border border-accent-muted/20 flex items-center justify-center opacity-30 group-hover:opacity-100 transition-opacity">
                   <ChevronRight className="w-4 h-4 text-accent-warm" />
                </div>
             </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
