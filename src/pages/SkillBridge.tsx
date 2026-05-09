import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { analyzeSkillBridge } from '../lib/api';

const COMPANIES = [
  { id: 'c1', name: 'Nocturne Robotics', type: 'Startup' },
  { id: 'c2', name: 'Google', type: 'MNC' },
  { id: 'c3', name: 'Hudson River Trading', type: 'HFT' },
  { id: 'c4', name: 'OpenAI', type: 'Research' },
  { id: 'c5', name: 'Aether Cloud', type: 'Startup' }
];

export default function SkillBridge() {
  const [selectedCompany, setSelectedCompany] = useState(COMPANIES[0]);
  const [search, setSearch] = useState('');
  
  const [currentData, setCurrentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBridgeData = async () => {
      setLoading(true);
      try {
        const data = await analyzeSkillBridge('test-student', selectedCompany.name);
        setCurrentData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBridgeData();
  }, [selectedCompany]);

  if (!currentData) return <div className="p-20 text-center animate-pulse text-accent-warm">Analyzing Bridges...</div>;

  return (
    <div className="space-y-16 pt-8 pb-32">
      <header className="space-y-8 max-w-2xl mx-auto text-center">
        <div className="space-y-2">
          <h2 className="text-6xl font-display italic text-accent-cream">Bridge</h2>
          <p className="small-caps text-accent-muted text-[10px]">Comparative Path Logic</p>
        </div>

        {/* Company Selector */}
        <div className="glass-card p-2 flex gap-2 relative">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-muted" />
            <input 
              type="text" 
              placeholder="Search target company (Startup or MNC)..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent py-3 pl-12 pr-4 text-xs text-accent-cream focus:outline-none font-sans"
            />
          </div>
          {search && (
            <div className="absolute top-full left-0 right-0 mt-2 glass-card p-2 z-50 bg-bg-primary/95">
              {COMPANIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map(c => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCompany(c); setSearch(''); }}
                  className="w-full text-left p-3 text-xs text-text-body hover:bg-white/5 font-sc tracking-widest flex justify-between"
                >
                  {c.name} <span className="opacity-40 italic">{c.type}</span>
                </button>
              ))}
            </div>
          )}
          <div className="bg-accent-warm/10 text-accent-warm px-4 flex items-center text-[10px] uppercase font-bold tracking-widest border border-accent-warm/20">
            {selectedCompany.name}
          </div>
        </div>
      </header>

      {/* Comparison Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 hidden lg:block opacity-20">
           <div className="w-[1px] h-[500px] bg-accent-warm relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-accent-warm rotate-45 bg-bg-primary shadow-[0_0_15px_rgba(196,149,106,0.3)]" />
              <p className="absolute top-1/2 left-4 -translate-y-1/2 whitespace-nowrap text-[9px] font-sc tracking-[0.4em] text-accent-warm uppercase italic">VIA TUA, VICTORIA TUA</p>
           </div>
        </div>

        <ComparisonTable 
          title="ON-CAMPUS" 
          sub="Structured Pipeline" 
          data={currentData.campus} 
          isWinner={false}
        />
        <ComparisonTable 
          title="OFF-CAMPUS" 
          sub="Organic Networking" 
          data={currentData.offCampus} 
          isWinner={true}
        />
      </div>

      {/* Probability Match */}
      <motion.footer 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-12"
      >
        <div className="text-center space-y-4">
           <h3 className="text-4xl md:text-5xl font-display italic text-accent-cream leading-tight">
             {selectedCompany.type === 'Startup' ? 'Off-Campus' : 'Direct'} gives you <span className="text-accent-warm">{currentData.odds}% better odds</span>
           </h3>
           <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
             <div className="space-y-2">
                <p className="text-[10px] font-mono text-accent-muted uppercase text-left">On-Campus Success</p>
                <div className="h-2 w-full bg-accent-muted/10 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     whileInView={{ width: '40%' }}
                     className="h-full bg-accent-burgundy" 
                   />
                </div>
             </div>
             <div className="space-y-2">
                <p className="text-[10px] font-mono text-accent-muted uppercase text-right">Off-Campus Success</p>
                <div className="h-2 w-full bg-accent-muted/10 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     whileInView={{ width: '85%' }}
                     className="h-full bg-accent-warm" 
                   />
                </div>
             </div>
           </div>
        </div>

        <div className="space-y-6">
          <p className="text-[10px] font-sc text-accent-muted text-center tracking-[0.3em]">Alumni who bypassed the structure</p>
          <div className="flex flex-wrap justify-center gap-4">
            {currentData.alumni.map((name: string) => (
              <div key={name} className="glass-card p-4 flex items-center gap-4 hover:border-accent-warm/40 transition-all cursor-pointer min-w-[200px]">
                <div className="w-8 h-8 rounded-full bg-bg-secondary border border-accent-muted/20 flex items-center justify-center text-[10px] text-accent-warm font-mono">{name[0]}</div>
                <div>
                  <p className="text-xs font-heading text-accent-cream">{name}</p>
                  <p className="text-[9px] text-accent-muted font-mono uppercase">Path: Direct Forge</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.footer>
    </div>
  );
}

function ComparisonTable({ title, sub, data, isWinner }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      className={cn(
        "glass-card overflow-hidden transition-all duration-700",
        isWinner && "border-accent-warm/40 shadow-[0_0_40px_rgba(196,149,106,0.05)]"
      )}
    >
      <div className={cn(
        "py-6 px-8 border-b border-accent-muted/10 flex justify-between items-end",
        isWinner && "bg-accent-warm/[0.03]"
      )}>
        <div>
           <h3 className={cn("text-xl font-heading tracking-[0.1em]", isWinner ? "text-accent-warm" : "text-accent-cream")}>{title}</h3>
           <p className="text-[10px] font-mono text-accent-muted uppercase tracking-widest">{sub}</p>
        </div>
        {isWinner && (
          <div className="flex items-center gap-1.5 text-[10px] font-sc text-accent-warm border border-accent-warm/30 px-3 py-1 bg-accent-warm/5">
             <Zap className="w-3 h-3" /> OPTIMIZED
          </div>
        )}
      </div>

      <div className="p-2">
        <table className="w-full text-left font-mono text-[10px] text-text-body">
          <tbody>
            {data.map((row: any, i: number) => (
              <motion.tr 
                key={row.factor}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="border-b border-accent-muted/5 group hover:bg-white/[0.02]"
              >
                <td className="p-4 uppercase tracking-widest text-[9px] opacity-60 group-hover:opacity-100 transition-opacity">{row.factor}</td>
                <td className={cn(
                  "p-4 text-right font-display italic text-lg",
                  isWinner ? "text-accent-warm" : "text-accent-cream"
                )}>{row.data}</td>
                <td className="p-4 text-right text-accent-muted border-l border-accent-muted/5 w-24">{row.user}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
