import { useState } from 'react';
import { Send, RotateCcw, Copy, ExternalLink, Sparkles, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { forgeColdEmail } from '../lib/api';

export default function ColdEmailForge() {
  const [tone, setTone] = useState('Conversational');
  const [subject, setSubject] = useState('Building Nocturne: A spatial mesh proposal');
  const [body, setBody] = useState(`Dear Founders,\n\nI've been tracking Nocturne's progress on the Spatial Mesh edge sensors. As a final project validated by Aria Vance (Class of '14), I developed an optimized CUDA kernel that reduces point cloud latency by 22% compared to standard Eigen implementations.\n\nI've attached the artifact repository for your review. I'd love to discuss how this could integrate with your current sensor stack.\n\nBest,\nJulian`);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleRegenerate = async () => {
    setIsGenerating(true);
    try {
      const email = await forgeColdEmail('test-student', 'startup_1', 'proj_1', tone.toLowerCase());
      if (email.subject) setSubject(email.subject);
      if (email.body) setBody(email.body);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-12 pt-8 min-h-[70vh]">
      {/* Context Sidebar */}
      <aside className="w-full lg:w-[320px] space-y-8">
        <div className="space-y-4">
          <h2 className="text-5xl font-display italic text-accent-cream">The Forge</h2>
          <p className="small-caps text-accent-muted text-[10px]">Cold Outreach Synthesis</p>
        </div>

        <div className="glass-card p-6 space-y-6">
          <div className="space-y-2">
            <p className="text-[9px] font-sc text-accent-warm uppercase tracking-widest">Context Inputs</p>
            <div className="h-px bg-accent-muted/20" />
          </div>
          
          <div className="space-y-4">
             <div className="p-3 bg-bg-secondary border border-accent-muted/20 rounded-[2px] space-y-1">
               <p className="text-[10px] font-sc text-accent-cream tracking-widest">STARTUP</p>
               <p className="text-xs text-text-body">Nocturne Robotics</p>
             </div>
             <div className="p-3 bg-accent-warm/5 border border-accent-warm/20 rounded-[2px] space-y-1">
               <p className="text-[10px] font-sc text-accent-warm tracking-widest">VALIDATOR</p>
               <p className="text-xs text-text-body">Aria Vance (Lumina AI)</p>
             </div>
             <div className="p-3 bg-bg-secondary border border-accent-muted/20 rounded-[2px] space-y-1">
               <p className="text-[10px] font-sc text-accent-cream tracking-widest">ARTIFACT</p>
               <p className="text-xs text-text-body">Edge-Optimized Spatial Mesh</p>
             </div>
          </div>

          <div className="pt-4 mt-4 border-t border-accent-muted/10">
             <p className="text-[10px] text-accent-muted italic leading-relaxed">"The perfect email is short, technically specific, and socially validated."</p>
          </div>
        </div>
      </aside>

      {/* Editor Main */}
      <div className="flex-1 space-y-6">
        <div className="glass-card overflow-hidden">
          <div className="bg-white/5 px-6 py-3 flex items-center justify-between border-b border-accent-muted/20">
             <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-accent-burgundy/50" />
                   <div className="w-2 h-2 rounded-full bg-accent-warm/50" />
                   <div className="w-2 h-2 rounded-full bg-accent-cream/50" />
                </div>
                <span className="text-[10px] font-mono text-accent-muted uppercase tracking-[0.2em] ml-4">New Transmission</span>
             </div>
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-[9px] font-sc text-accent-muted border border-accent-muted/30 px-3 py-1 rounded-full cursor-pointer hover:border-accent-warm transition-all">
                  TONE: {tone.toUpperCase()} <ChevronDown className="w-3 h-3" />
                </div>
                <button onClick={handleRegenerate} disabled={isGenerating} className="flex items-center gap-2 text-[9px] font-sc text-accent-warm hover:text-accent-cream disabled:opacity-50">
                  <Sparkles className="w-3 h-3" /> {isGenerating ? 'FORGING...' : 'REGENERATE'}
                </button>
             </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-2">
               <label className="text-[9px] font-sc text-accent-muted tracking-[0.3em]">SUBJECT</label>
               <input 
                 type="text" 
                 value={subject}
                 onChange={(e) => setSubject(e.target.value)}
                 className="w-full bg-transparent border-b border-accent-muted/20 pb-2 text-sm text-accent-cream focus:outline-none focus:border-accent-warm transition-all font-heading" 
               />
            </div>
            
            <div className="space-y-2">
               <label className="text-[9px] font-sc text-accent-muted tracking-[0.3em]">BODY</label>
               <textarea 
                 rows={12}
                 value={body}
                 onChange={(e) => setBody(e.target.value)}
                 className="w-full bg-transparent border border-accent-muted/10 p-6 text-sm text-text-body font-sans leading-relaxed focus:outline-none focus:border-accent-warm/30 transition-all resize-none"
               />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-6 pt-4">
              <div className="flex items-center gap-6">
                <button className="flex items-center gap-2 text-[10px] font-sc text-accent-muted hover:text-accent-cream transition-colors">
                  <Copy className="w-4 h-4" /> COPY TEXT
                </button>
                <button className="flex items-center gap-2 text-[10px] font-sc text-accent-muted hover:text-accent-cream transition-colors">
                  <RotateCcw className="w-4 h-4" /> RESET DRAFT
                </button>
              </div>
              <div className="flex items-center gap-4">
                <button className="px-8 py-3 border border-accent-muted/30 text-accent-muted font-sc text-xs tracking-widest hover:border-accent-cream hover:text-accent-cream transition-all">
                  SAVE DRAFT
                </button>
                <button className="px-8 py-3 bg-accent-warm text-bg-primary font-sc text-xs tracking-widest hover:bg-accent-cream transition-all flex items-center gap-2">
                  <Send className="w-4 h-4" /> DISPATCH
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
           {['Formal', 'Conversational', 'Technical', 'Bold'].map(t => (
             <button 
               key={t}
               onClick={() => setTone(t)}
               className={cn(
                 "text-[9px] font-sc px-3 py-1 border transition-all",
                 tone === t ? "bg-accent-warm text-bg-primary border-accent-warm" : "text-accent-muted border-accent-muted/20 hover:border-accent-muted"
               )}
             >
               {t.toUpperCase()}
             </button>
           ))}
        </div>
      </div>
    </div>
  );
}
