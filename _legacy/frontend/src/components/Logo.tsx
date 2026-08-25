import { TrendingUp } from 'lucide-react';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Icon is always visible */}
      <TrendingUp className="h-6 w-6 text-primary shrink-0 transition-transform duration-300 hover:scale-110" />
      
      {/* Text changes sizes or hides based on breakpoints */}
      <span className="font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent transition-all duration-300
        hidden sm:inline-block sm:text-base lg:text-lg">
        FitdaysWeb
      </span>
    </div>
  );
}
