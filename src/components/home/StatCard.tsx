import { LucideIcon } from 'lucide-react';
import { useCountUp } from '@/hooks/use-count-up';

interface StatCardProps {
  value: number;
  suffix?: string;
  label: string;
  Icon: LucideIcon;
  index: number;
}

export function StatCard({ value, suffix = "+", label, Icon, index }: StatCardProps) {
  const { count, ref, isComplete } = useCountUp({ end: value, duration: 2000 });

  return (
    <div 
      ref={ref}
      className="group relative bg-background rounded-2xl p-6 shadow-sm border border-border/50 transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 cursor-default animate-fade-in"
      style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'backwards' }}
    >
      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10 text-center">
        {/* Icon with animated container */}
        <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary group-hover:scale-110 group-hover:rotate-3 ${isComplete ? 'animate-bounce-once' : ''}`}>
          <Icon className="h-6 w-6 text-primary transition-colors duration-300 group-hover:text-primary-foreground" />
        </div>
        <div className={`text-3xl lg:text-4xl font-bold text-primary mb-1 transition-transform duration-300 group-hover:scale-105 tabular-nums ${isComplete ? 'animate-bounce-once' : ''}`}>
          {count}{suffix}
        </div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
      
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden rounded-tr-2xl">
        <div className="absolute -top-4 -right-4 w-8 h-8 bg-primary/10 rotate-45 group-hover:bg-primary/20 transition-colors duration-300" />
      </div>
    </div>
  );
}
