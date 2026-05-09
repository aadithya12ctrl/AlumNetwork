import { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, BookOpen, Users, MapPin, Briefcase, GraduationCap, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AlumniDashboard() {
  const [step, setStep] = useState(1);
  const [isRegistered, setIsRegistered] = useState(false);

  return (
    <div className="space-y-16 pt-8 pb-32">
      <header className="space-y-8 max-w-4xl mx-auto text-center">
        <div className="space-y-2">
          <h2 className="text-7xl font-display italic text-accent-cream engraved-text">Vault</h2>
          <p className="small-caps text-accent-warm">Alumni Authentication & Identity</p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto">
        {!isRegistered ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Steps Navigation */}
            <div className="lg:col-span-1 space-y-8">
              {[
                { s: 1, title: 'Identity', desc: 'Verify your heritage' },
                { s: 2, title: 'Domain', desc: 'Current influence' },
                { s: 3, title: 'Mentorship', desc: 'Forge the future' },
              ].map((item) => (
                <div 
                  key={item.s}
                  className={cn(
                    "relative pl-8 transition-all duration-500",
                    step === item.s ? "opacity-100" : "opacity-30"
                  )}
                >
                  <div className={cn(
                    "absolute left-0 top-1 w-px h-full bg-accent-muted/20",
                    step >= item.s && "bg-accent-warm"
                  )} />
                  {step === item.s && (
                    <motion.div 
                      layoutId="step-indicator"
                      className="absolute left-[-4px] top-1 w-2 h-2 rounded-full bg-accent-warm shadow-[0_0_10px_rgba(196,149,106,1)]"
                    />
                  )}
                  <h4 className="text-xs font-sc tracking-widest text-accent-cream uppercase">{item.title}</h4>
                  <p className="text-[10px] font-mono text-accent-muted">{item.desc}</p>
                </div>
              ))}

              <div className="pt-12">
                 <div className="glass-card p-6 bg-accent-burgundy/5 border-accent-burgundy/20">
                    <Shield className="w-5 h-5 text-accent-burgundy mb-4" />
                    <p className="text-[10px] leading-relaxed text-text-body font-display italic">
                      "Each entry in the Directory is manually verified to maintain the sanctity of the network."
                    </p>
                 </div>
              </div>
            </div>

            {/* Form Area */}
            <div className="lg:col-span-2">
              <motion.div 
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card card-texture p-12 space-y-10"
              >
                {step === 1 && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-sc tracking-widest text-accent-muted uppercase">Full Name</label>
                        <input className="w-full bg-transparent border-b border-accent-muted/20 py-2 text-sm text-accent-cream focus:outline-none focus:border-accent-warm transition-colors font-heading" placeholder="Julian Blackwood" />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-sc tracking-widest text-accent-muted uppercase">Batch Year</label>
                        <input className="w-full bg-transparent border-b border-accent-muted/20 py-2 text-sm text-accent-cream focus:outline-none focus:border-accent-warm transition-colors font-heading" placeholder="2018" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-sc tracking-widest text-accent-muted uppercase">University ID / Serial</label>
                      <input className="w-full bg-transparent border-b border-accent-muted/20 py-2 text-sm text-accent-cream focus:outline-none focus:border-accent-warm transition-colors font-heading" placeholder="CSE-18-092-A" />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-sc tracking-widest text-accent-muted uppercase">Current Role</label>
                        <input className="w-full bg-transparent border-b border-accent-muted/20 py-2 text-sm text-accent-cream focus:outline-none focus:border-accent-warm transition-colors font-heading" placeholder="Distributed Systems Lead" />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-sc tracking-widest text-accent-muted uppercase">Company</label>
                        <input className="w-full bg-transparent border-b border-accent-muted/20 py-2 text-sm text-accent-cream focus:outline-none focus:border-accent-warm transition-colors font-heading" placeholder="Cloudflare" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-sc tracking-widest text-accent-muted uppercase">Key Expertise (Comma separated)</label>
                      <input className="w-full bg-transparent border-b border-accent-muted/20 py-2 text-sm text-accent-cream focus:outline-none focus:border-accent-warm transition-colors font-heading" placeholder="Rust, Networking, Wasm, Consensus Algos" />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-8">
                    <p className="text-sm font-display italic text-text-body/80 leading-relaxed">
                      Willing to guide the next generation? Choose your availability for the "Forge" requests.
                    </p>
                    <div className="grid grid-cols-1 gap-4">
                      {['Mock Interviews', 'Referral Assistance', 'Project Feedback', 'Career Wisdom'].map((item) => (
                        <label key={item} className="flex items-center gap-4 p-4 border border-accent-muted/10 hover:border-accent-warm/30 cursor-pointer transition-all">
                          <input type="checkbox" className="w-4 h-4 rounded-none bg-transparent border-accent-warm text-accent-warm" />
                          <span className="text-[11px] font-sc tracking-widest text-accent-cream uppercase">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-8 h-12">
                   {step > 1 && (
                     <button 
                       onClick={() => setStep(step - 1)}
                       className="text-[10px] font-sc tracking-widest text-accent-muted hover:text-accent-cream transition-colors"
                     >
                       ← BACK
                     </button>
                   )}
                   <button 
                     onClick={() => {
                        if (step < 3) setStep(step + 1);
                        else setIsRegistered(true);
                     }}
                     className="ml-auto bg-accent-warm text-bg-primary px-8 flex items-center text-[10px] font-sc tracking-[0.2em] font-bold hover:bg-accent-cream transition-all"
                   >
                     {step === 3 ? 'FINALIZE IDENTITY' : 'CONTINUE →'}
                   </button>
                </div>
              </motion.div>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-16 text-center space-y-12 max-w-2xl mx-auto card-texture border-accent-warm/40"
          >
             <div className="w-24 h-24 rounded-full border-2 border-accent-warm/30 flex items-center justify-center mx-auto mb-8 bg-accent-warm/5">
                <CheckCircle2 className="w-10 h-10 text-accent-warm" />
             </div>
             <div className="space-y-4">
                <h3 className="text-4xl font-display italic text-accent-cream">Registered into the Directory</h3>
                <p className="text-sm text-accent-muted font-display italic">"Your path is now illuminated for those who seek to follow."</p>
             </div>
             <div className="flex flex-col gap-4 max-w-xs mx-auto">
                <button className="w-full py-4 border border-accent-warm text-accent-warm text-[10px] font-sc tracking-widest hover:bg-accent-warm hover:text-bg-primary transition-all">
                  VIEW YOUR NODE
                </button>
                <div className="flex items-center justify-center gap-4 text-[9px] font-mono text-accent-muted uppercase">
                   <div className="w-2 h-2 rounded-full bg-accent-warm animate-pulse" /> Identity Verified
                </div>
             </div>
          </motion.div>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[
          { icon: Users, label: 'Peer Nodes', val: '1,427' },
          { icon: BookOpen, label: 'Mentors Active', val: '412' },
          { icon: MapPin, label: 'Global Hubs', val: '22' },
          { icon: Shield, label: 'Trust Score', val: '98.2' },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 flex items-center gap-6"
          >
            <div className="w-10 h-10 rounded-full border border-accent-muted/20 flex items-center justify-center text-accent-warm">
              <stat.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[18px] font-mono text-accent-cream leading-tight">{stat.val}</p>
              <p className="text-[9px] font-sc tracking-widest text-accent-muted uppercase">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
