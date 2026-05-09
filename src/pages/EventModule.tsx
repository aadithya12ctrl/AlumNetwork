import { useState, useEffect } from 'react';
import { fetchEvents } from '../lib/api';
import { Event } from '../types';
import { motion } from 'motion/react';
import { Calendar as CalendarIcon, MapPin, Clock, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

export default function EventModule() {
  const [selectedDay, setSelectedDay] = useState(12);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await fetchEvents();
        setEvents(data);
      } catch (err) {
        console.error("Failed to fetch events", err);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row gap-12 pt-8">
        {/* Calendar Column */}
        <div className="flex-1 space-y-8">
          <div className="flex items-baseline gap-4 mb-4">
            <h2 className="text-6xl font-display italic text-accent-cream">Chronos</h2>
            <span className="small-caps text-accent-muted text-xs">Events & Gatherings</span>
          </div>
          
          <div className="glass-card p-8">
            <div className="grid grid-cols-7 gap-y-4 mb-8">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                <div key={day} className="text-center text-[10px] text-accent-muted font-sc tracking-widest">{day}</div>
              ))}
              {Array.from({ length: 2 }).map((_, i) => <div key={`empty-${i}`} />)}
              {days.map(day => {
                const hasEvent = events.some(e => e.day === day);
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "aspect-square flex flex-col items-center justify-center relative rounded-[2px] transition-all",
                      selectedDay === day ? "bg-accent-warm text-bg-primary shadow-[0_0_15px_rgba(196,149,106,0.3)]" : "text-text-body hover:bg-white/5",
                      hasEvent && selectedDay !== day && "text-accent-cream font-bold"
                    )}
                  >
                    <span className="text-sm font-mono">{day.toString().padStart(2, '0')}</span>
                    {hasEvent && (
                      <div className={cn(
                        "w-1 h-1 rounded-full absolute bottom-2",
                        selectedDay === day ? "bg-bg-primary" : "bg-accent-warm"
                      )} />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="h-px bg-accent-muted/10 relative my-4" />
            <p className="text-[10px] text-accent-muted font-mono tracking-widest italic text-center">
              "TIME IS THE CANVAS ON WHICH WE PAINT OUR LEGACIES."
            </p>
          </div>
        </div>

        {/* List Column */}
        <div className="w-full lg:w-[400px] space-y-6">
          <h3 className="text-xl font-heading text-accent-cream">Upcoming Occasions</h3>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-10 text-accent-muted font-mono text-xs animate-pulse">
                 SYNCING CHRONOS...
              </div>
            ) : events.map((event, i) => (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={event.id}
                className={cn(
                  "glass-card p-5 group flex gap-5 border-l-2",
                  event.type === 'Webinar' ? "border-l-accent-cream" : 
                  event.type === 'Reunion' ? "border-l-accent-burgundy" : "border-l-accent-warm"
                )}
              >
                <div className="text-center min-w-[50px] flex flex-col justify-center border-r border-accent-muted/10 pr-5">
                  <span className="text-2xl font-mono text-accent-warm leading-none mb-1">{event.date.split(' ')[1]}</span>
                  <span className="text-[9px] font-sc text-accent-muted uppercase tracking-[0.2em]">{event.date.split(' ')[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "px-2 py-0.5 text-[8px] font-sc uppercase tracking-widest border",
                      event.type === 'Webinar' ? "border-accent-cream text-accent-cream" : 
                      event.type === 'Reunion' ? "border-accent-burgundy text-accent-burgundy" : "border-accent-warm text-accent-warm"
                    )}>
                      {event.type}
                    </span>
                    <span className="text-[8px] text-accent-muted font-mono">BY {event.speaker.toUpperCase()}</span>
                  </div>
                  <h4 className="text-sm font-heading text-accent-cream truncate mb-3 group-hover:text-accent-warm transition-colors">{event.title}</h4>
                  <button className="flex items-center gap-2 text-[10px] font-sc text-accent-warm hover:text-accent-cream transition-colors">
                    RSVP NOW <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
