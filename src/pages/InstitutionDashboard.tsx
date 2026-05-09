import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { ArrowUpRight, TrendingDown, Users, Briefcase, GraduationCap, Globe } from 'lucide-react';
import { motion } from 'motion/react';

const STATS = [
  { label: 'Total Alumni', value: '4,821', trend: '+12%', icon: Users },
  { label: 'Active Mentors', value: '342', trend: '+5%', icon: GraduationCap },
  { label: 'Placements 2026', value: '89%', trend: '+3%', icon: Briefcase },
  { label: 'Global Chapters', value: '14', trend: '0%', icon: Globe },
];

const DOMAIN_DATA = [
  { name: 'Engineering', value: 45 },
  { name: 'Product', value: 20 },
  { name: 'Finance', value: 15 },
  { name: 'Design', value: 12 },
  { name: 'Legal', value: 8 },
];

const TREND_DATA = [
  { year: '2021', placements: 72 },
  { year: '2022', placements: 78 },
  { year: '2023', placements: 82 },
  { year: '2024', placements: 85 },
  { year: '2025', placements: 89 },
];

export default function InstitutionDashboard() {
  return (
    <div className="space-y-12 pb-12">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-8">
        <div>
          <h2 className="text-6xl font-display italic text-accent-cream leading-tight">Insight</h2>
          <p className="small-caps text-accent-muted text-xs">Institutional Performance Analytics</p>
        </div>
        <button className="px-6 py-3 border border-accent-warm text-accent-warm font-sc text-xs hover:bg-accent-warm hover:text-bg-primary transition-all">
          EXPORT ANNUAL REPORT
        </button>
      </section>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <stat.icon className="w-5 h-5 text-accent-muted" strokeWidth={1} />
              <div className="flex items-center gap-1 text-[10px] text-accent-warm font-mono tracking-widest">
                {stat.trend} <ArrowUpRight className="w-3 h-3" />
              </div>
            </div>
            <p className="text-4xl font-mono text-accent-cream mb-1">{stat.value}</p>
            <p className="small-caps text-[10px] text-accent-muted">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8 min-h-[400px] flex flex-col">
          <h3 className="text-lg font-heading text-accent-cream mb-8">Alumni Domain Distribution</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DOMAIN_DATA} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#4A4A4A" horizontal={false} opacity={0.2} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#A89880" 
                  fontSize={10} 
                  fontFamily="Inter"
                  width={80}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111111', border: '1px solid #4A4A4A', borderRadius: '2px' }}
                  itemStyle={{ color: '#E8DCC8', fontFamily: 'DM Mono' }}
                />
                <Bar dataKey="value" fill="#C4956A">
                  {DOMAIN_DATA.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#C4956A' : '#6B2737'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8 min-h-[400px] flex flex-col">
          <h3 className="text-lg font-heading text-accent-cream mb-8">Yearly Placement Trend</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4A4A4A" vertical={false} opacity={0.2} />
                <XAxis 
                  dataKey="year" 
                  stroke="#4A4A4A" 
                  fontSize={10} 
                  fontFamily="DM Mono"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#4A4A4A" 
                  fontSize={10} 
                  fontFamily="DM Mono"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#111111', border: '1px solid #4A4A4A', borderRadius: '2px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="placements" 
                  stroke="#E8DCC8" 
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#C4956A', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#E8DCC8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Success Feed */}
      <section className="space-y-6">
        <h3 className="text-xl font-heading text-accent-cream">Recent Archives</h3>
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex gap-4 items-center">
                 <div className="w-12 h-12 bg-bg-secondary border border-accent-muted/20 flex items-center justify-center p-2 italic font-display text-accent-warm">
                    {i === 1 ? 'G' : i === 2 ? 'A' : 'M'}
                 </div>
                 <div>
                    <h4 className="text-sm font-heading text-accent-cream">
                      {i === 1 ? 'Gabriel Thorne placed at Goldman Sachs' : i === 2 ? 'Aria Vance founded Lumina AI' : 'Marcus Pym joined DeepMind Labs'}
                    </h4>
                    <p className="text-[10px] text-accent-muted font-mono tracking-widest uppercase">Success Story • {i}h ago</p>
                 </div>
              </div>
              <button className="text-[10px] font-sc text-accent-warm hover:text-accent-cream transition-colors flex items-center gap-1">
                READ ARTIFACT <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
