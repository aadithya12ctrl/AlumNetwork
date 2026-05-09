import { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { 
  CheckCircle2, 
  ArrowRight, 
  Github, 
  ExternalLink, 
  MessageSquare,
  Zap,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { fetchStartups, generateProject, requestValidation } from '../lib/api';
import { Startup } from '../types';

export default function BuildToApply({ initialStartup }: { initialStartup: any }) {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(initialStartup || null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [generatedProject, setGeneratedProject] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  useEffect(() => {
    const loadStartups = async () => {
      const data = await fetchStartups();
      setStartups(data);
      if (!selectedStartup && data.length > 0) {
        setSelectedStartup(data[0]);
      }
    };
    loadStartups();
  }, []);
  
  const scrollRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end end"]
  });

  const getDynamicProjects = (startupName: string) => [
    { 
      id: 'p1', 
      title: 'Edge-Optimized Spatial Mesh', 
      tech: 'CUDA / C++ / Eigen',
      prompt: `Develop a lightweight C++ module for ${startupName}'s core stack that can process 4K LIDAR point clouds at 60fps with less than 20ms latency. Use CUDA for acceleration.`
    },
    { 
      id: 'p2', 
      title: 'Neural Perception Patch', 
      tech: 'PyTorch / TensorRT',
      prompt: `Implement a quantized Vision Transformer (ViT) for ${startupName}'s anomaly detection pipeline, achieving 98% accuracy on edge hardware.`
    },
    { 
      id: 'p3', 
      title: 'Asynchronous Stream Buffer', 
      tech: 'Rust / ZeroMQ',
      prompt: `Architect a high-throughput diagnostic buffer in Rust for ${startupName}'s telemetry streams, handling 10GB/s with zero packet loss during hardware context switching.`
    }
  ];

  const startupName = selectedStartup?.name || 'the target venture';
  const projects = generatedProject ? [generatedProject] : getDynamicProjects(startupName);

  const handleGenerateProject = async () => {
    if (!selectedStartup) return;
    setIsGenerating(true);
    try {
      const res = await generateProject('test-student', selectedStartup.id);
      setGeneratedProject({
        id: res.project_id || 'generated-1',
        title: res.project_title,
        tech: res.tech_stack?.join(' / ') || 'Custom Stack',
        problem: res.problem_statement,
        challenge: res.technical_challenge,
        build: res.what_to_build,
        decisions: res.architectural_decisions,
        metrics: res.evaluation_metrics,
        why: res.why_this_impresses,
        readme: res.readme_template
      });
      setSelectedProject(res.project_id || 'generated-1');
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleValidate = async () => {
    try {
      await requestValidation(selectedProject || 'generated-1', '1');
      alert("Validation requested!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative pt-12 pb-24" ref={scrollRef}>
      {/* Background Progress Line */}
      <div className="fixed left-8 top-1/4 bottom-1/4 w-px bg-accent-muted/20 hidden lg:block">
        <motion.div 
          className="w-full bg-accent-warm origin-top"
          style={{ height: useTransform(scrollYProgress, [0, 1], ["0%", "100%"]) }}
        />
      </div>

      <div className="space-y-[40vh] max-w-4xl mx-auto lg:pl-12">
        <Step 
          index="I" 
          title="Startup Selection" 
          description="Identify the venture you wish to influence. Select a target from our vetted accelerator stream."
          tagline="Select your battlefield"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
            {startups.map(startup => (
              <button
                key={startup.id}
                onClick={() => setSelectedStartup(startup)}
                className={cn(
                  "p-6 text-left glass-card transition-all",
                  selectedStartup?.id === startup.id ? "border-accent-warm bg-accent-warm/5" : "opacity-60 hover:opacity-100"
                )}
              >
                 <div className="flex justify-between items-start mb-4">
                    <h4 className="text-xl font-heading text-accent-cream">{startup.name}</h4>
                    {selectedStartup?.id === startup.id && <Zap className="w-4 h-4 text-accent-warm animate-pulse" />}
                 </div>
                 <p className="text-[10px] font-sc text-accent-muted uppercase tracking-widest">{startup.domain}</p>
              </button>
            ))}
          </div>
        </Step>

        <Step 
          index="II" 
          title="Project Blueprint" 
          description="A specialized technical prompt generated to showcase your architectural prowess."
          tagline="Silentium et decorum"
        >
          <div className="space-y-4 mt-12">
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project.id)}
                className={cn(
                  "w-full text-left glass-card p-8 transition-all group",
                  selectedProject === project.id ? "border-accent-warm bg-accent-warm/5" : "hover:border-accent-muted"
                )}
              >
                <div className="flex justify-between items-center mb-4">
                   <h4 className="text-xl font-heading text-accent-cream">{project.title}</h4>
                   <span className="text-[9px] font-mono text-accent-warm">{project.tech}</span>
                </div>
                {selectedProject === project.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="overflow-hidden space-y-6"
                  >
                    <div className="pt-4 border-t border-accent-muted/10">
                       <p className="text-[10px] uppercase tracking-widest text-accent-warm mb-2 font-sc">The Problem</p>
                       <p className="text-xs text-text-body/70 leading-relaxed italic">{project.problem || project.prompt}</p>
                    </div>

                    {project.challenge && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-accent-warm mb-2 font-sc">Technical Challenge</p>
                        <p className="text-xs text-text-body/70 leading-relaxed">{project.challenge}</p>
                      </div>
                    )}

                    {project.build && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-accent-warm mb-2 font-sc">Modular Breakdown</p>
                        <p className="text-xs text-text-body/70 leading-relaxed whitespace-pre-line">{project.build}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                      {project.decisions && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-accent-warm mb-2 font-sc">Architectural Pivot</p>
                          <ul className="text-[11px] text-text-body/60 list-disc pl-4 space-y-1">
                            {Array.isArray(project.decisions) ? project.decisions.map((d: any, i: number) => <li key={i}>{d}</li>) : <li>{project.decisions}</li>}
                          </ul>
                        </div>
                      )}
                      {project.metrics && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-accent-warm mb-2 font-sc">Validation Metrics</p>
                          <ul className="text-[11px] text-text-body/60 list-disc pl-4 space-y-1">
                             {Array.isArray(project.metrics) ? project.metrics.map((m: any, i: number) => <li key={i}>{m}</li>) : <li>{project.metrics}</li>}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6 p-4 bg-bg-secondary border border-accent-muted/20 text-[10px] font-mono text-accent-warm flex items-center gap-2">
                       <CheckCircle2 className="w-3 h-3" /> INVARIANT ACCEPTED: PROCEED TO VALIDATION
                    </div>
                  </motion.div>
                )}
                {selectedProject !== project.id && (
                  <button onClick={(e) => { e.stopPropagation(); handleGenerateProject(); }} className="text-[10px] font-sc text-accent-muted hover:text-accent-warm transition-colors uppercase tracking-widest mt-4">
                    {isGenerating ? 'INITIALIZING CORE...' : 'INITIALIZE PROJECT CORE'}
                  </button>
                )}
              </button>
            ))}
          </div>
        </Step>

        <Step 
          index="III" 
          title="Validation Request" 
          description="Request a review from domain experts who have already navigated this path."
          tagline="Seek the elders"
        >
           <div className="space-y-4 mt-12">
              <div className="glass-card p-6 flex items-center justify-between group cursor-pointer hover:border-accent-warm transition-all duration-500">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent-burgundy/20 border border-accent-burgundy/30 italic font-display text-accent-burgundy flex items-center justify-center text-xl">
                    EV
                  </div>
                  <div>
                    <h5 className="text-sm font-heading text-accent-cream">Eleanor Vance</h5>
                    <p className="text-[9px] font-sc text-accent-muted uppercase">Senior Kernel Engineer • Nvidia</p>
                  </div>
                </div>
                <button onClick={handleValidate} className="text-[10px] font-sc text-accent-warm flex items-center gap-2 group-hover:gap-4 transition-all uppercase tracking-widest">
                  Request Review <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="glass-card p-4 text-center border-dashed opacity-50">
                 <p className="text-[10px] font-mono text-accent-muted uppercase">Status: {selectedProject ? 'Awaiting Interaction' : 'Pending Project Selection'}</p>
              </div>
           </div>
        </Step>

        <Step 
          index="IV" 
          title="The Artifact" 
          description="The final output. Your project, validated, ready for the cold forge."
          tagline="Victory or Void"
        >
          <div className="glass-card p-12 mt-12 text-center space-y-8 bg-accent-warm/5">
             <ShieldCheck className="w-16 h-16 text-accent-warm mx-auto" strokeWidth={1} />
             <div className="space-y-2">
                <h4 className="text-3xl font-display italic text-accent-cream underline underline-offset-8">Endorsed Artifact</h4>
                <p className="text-xs text-text-body font-mono">HASH: 0x9a8f2...e3b1</p>
             </div>
             <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                   <input type="text" placeholder="GitHub Repository URL" className="flex-1 bg-transparent border-b border-accent-muted/50 py-2 text-xs focus:outline-none focus:border-accent-warm" />
                   <Github className="w-4 h-4 text-accent-muted" />
                </div>
                <div className="flex gap-4">
                   <input type="text" placeholder="Live Demo (optional)" className="flex-1 bg-transparent border-b border-accent-muted/50 py-2 text-xs focus:outline-none focus:border-accent-warm" />
                   <ExternalLink className="w-4 h-4 text-accent-muted" />
                </div>
             </div>
             <button className="w-full py-5 border border-accent-cream text-accent-cream font-sc tracking-[0.3em] text-sm hover:bg-accent-cream hover:text-bg-primary transition-all">
                FORGE COLD EMAIL
             </button>
          </div>
        </Step>
      </div>
    </div>
  );
}

function Step({ index, title, description, tagline, children }: any) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-100px" });

  return (
    <motion.section 
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative"
    >
      <div className="absolute -left-20 top-0 text-[180px] font-display italic text-accent-muted opacity-5 leading-none hidden lg:block -translate-y-1/2">
        {index}
      </div>
      <div className="max-w-xl">
        <p className="small-caps text-accent-warm text-[10px] mb-4">{tagline}</p>
        <h2 className="text-5xl font-display text-accent-cream mb-6 italic">{title}</h2>
        <p className="text-sm text-text-body/80 leading-relaxed font-sans">{description}</p>
        {children}
      </div>
    </motion.section>
  );
}
