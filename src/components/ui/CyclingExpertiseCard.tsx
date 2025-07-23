import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Dumbbell, Code, LucideIcon } from 'lucide-react';
import GlassCard from './GlassCard';
import { Button } from './button';
import { 
  TYPOGRAPHY, 
  COLORS, 
  ANIMATIONS 
} from '@/lib/design-system';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ExpertiseItem {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  colorTheme: string;
  gradientTheme: string;
  particleColor: string;
  borderColor: string;
  duration: number;
}

interface CyclingExpertiseCardProps {
  className?: string;
  autoRotate?: boolean;
  rotationSpeed?: number;
  pauseOnHover?: boolean;
}

// ============================================================================
// CONTENT CONFIGURATION WITH ENHANCED VISUAL THEMES
// ============================================================================

const expertiseContent: ExpertiseItem[] = [
  {
    id: 'finance',
    icon: TrendingUp,
    title: 'Finance',
    description: 'CFA Charterholder with 8+ years of Equity Research and Financial Consulting Experience',
    colorTheme: COLORS.finance.primary,
    gradientTheme: 'from-blue-500/20 via-cyan-500/15 to-blue-600/25',
    particleColor: 'bg-blue-400',
    borderColor: 'border-blue-400/50',
    duration: 4000,
  },
  {
    id: 'fitness', 
    icon: Dumbbell,
    title: 'Fitness',
    description: 'NASM Certified Personal Trainer & Fitness Enthusiast with NPC Physique Experience',
    colorTheme: COLORS.fitness.primary,
    gradientTheme: 'from-emerald-500/20 via-teal-500/15 to-emerald-600/25',
    particleColor: 'bg-emerald-400',
    borderColor: 'border-emerald-400/50',
    duration: 4000,
  },
  {
    id: 'design',
    icon: Code,
    title: 'Design', 
    description: 'Beginner Vibe Coder & App Designer. Currently at $ZERO MRR.',
    colorTheme: COLORS.apps.primary,
    gradientTheme: 'from-purple-500/20 via-pink-500/15 to-red-500/25',
    particleColor: 'bg-purple-400',
    borderColor: 'border-purple-400/50',
    duration: 4000,
  }
];

// ============================================================================
// FLOATING PARTICLES COMPONENT
// ============================================================================

const FloatingParticles: React.FC<{ particleColor: string; isActive: boolean }> = ({ 
  particleColor, 
  isActive 
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className={`
            absolute w-1 h-1 ${particleColor} rounded-full transition-opacity duration-500
            ${isActive ? 'opacity-60' : 'opacity-0'}
          `}
          style={{
            left: `${15 + (i * 10)}%`,
            top: `${20 + (i * 8)}%`,
            animation: isActive ? `float-${(i % 4) + 1} ${3 + (i * 0.3)}s ease-in-out ${i * 0.4}s infinite` : 'none',
          }}
        />
      ))}
      
      {/* Additional larger particles for depth */}
      {[...Array(4)].map((_, i) => (
        <div
          key={`large-${i}`}
          className={`
            absolute w-2 h-2 ${particleColor} rounded-full transition-opacity duration-700 opacity-30
            ${isActive ? 'opacity-30' : 'opacity-0'}
          `}
          style={{
            left: `${25 + (i * 20)}%`,
            top: `${30 + (i * 15)}%`,
            animation: isActive ? `float-slow-${(i % 2) + 1} ${5 + (i * 0.5)}s ease-in-out ${i * 0.8}s infinite` : 'none',
          }}
        />
      ))}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CyclingExpertiseCard: React.FC<CyclingExpertiseCardProps> = ({
  className = '',
  autoRotate = true,
  rotationSpeed = 4000,
  pauseOnHover = true,
}) => {
  // ============================================================================
  // STATE & REFS
  // ============================================================================
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [particlesActive, setParticlesActive] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout>();
  const timeoutRef = useRef<NodeJS.Timeout>();

  // ============================================================================
  // CURRENT CONTENT
  // ============================================================================
  
  const currentContent = expertiseContent[currentIndex];
  const CurrentIcon = currentContent.icon;

  // ============================================================================
  // ROTATION LOGIC
  // ============================================================================
  
  const rotateToNext = () => {
    setTransitioning(true);
    setParticlesActive(false);
    
    timeoutRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % expertiseContent.length);
      setTransitioning(false);
      setParticlesActive(true);
    }, 200); // Slightly longer for smooth gradient transition
  };

  // ============================================================================
  // AUTO-ROTATION EFFECT
  // ============================================================================
  
  useEffect(() => {
    if (!autoRotate || isPaused) return;

    intervalRef.current = setInterval(() => {
      rotateToNext();
    }, rotationSpeed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRotate, rotationSpeed, isPaused]);

  // ============================================================================
  // CLEANUP EFFECT
  // ============================================================================
  
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // ============================================================================
  // HOVER HANDLERS
  // ============================================================================
  
  const handleMouseEnter = () => {
    if (pauseOnHover) {
      setIsPaused(true);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      setIsPaused(false);
    }
  };

  // ============================================================================
  // ENHANCED TRANSITION CLASSES WITH BETTER READABILITY
  // ============================================================================
  
  const contentClasses = `${ANIMATIONS.transition.all} ${
    transitioning 
      ? 'opacity-0 transform translate-y-3 scale-95' 
      : 'opacity-100 transform translate-y-0 scale-100'
  }`;

  // Larger icons and enhanced text contrast with perfect matching white glow (desktop only)
  const iconClasses = `w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${currentContent.colorTheme} ${ANIMATIONS.transition.colors} md:drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] md:drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]`;
  const titleClasses = `${currentContent.colorTheme} text-sm sm:text-base md:text-lg lg:text-xl font-semibold ${ANIMATIONS.transition.colors} md:[text-shadow:_0_0_12px_rgba(255,255,255,0.9),_0_0_12px_rgba(255,255,255,0.6)]`;

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Animated Gradient Background Aura */}
      <div 
        className={`
          absolute inset-0 transition-all duration-1000 ease-out
          bg-gradient-to-br ${currentContent.gradientTheme}
          blur-xl scale-110 animate-pulse-gentle
        `}
      />
      
      {/* Secondary Gradient Layer for Depth */}
      <div 
        className={`
          absolute inset-0 transition-all duration-700 ease-out
          bg-gradient-to-tr ${currentContent.gradientTheme}
          blur-2xl scale-125 opacity-50
        `}
      />
      
      {/* Floating Particles */}
      <FloatingParticles 
        particleColor={currentContent.particleColor} 
        isActive={particlesActive && !isPaused}
      />
      
      <GlassCard 
        variant="base" 
        className={`
          relative w-full max-w-xs sm:max-w-sm md:max-w-lg 
          bg-white/20 backdrop-blur-lg border-2 ${currentContent.borderColor}
          shadow-2xl shadow-black/20
          transition-all duration-500
          hover:shadow-3xl hover:scale-[1.02]
          ${className}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          className="space-y-2 sm:space-y-3 md:space-y-4 relative z-10 p-1 sm:p-2"
          aria-live="polite"
          aria-label="Cycling through expertise areas"
        >
          {/* Enhanced Icon + Title with Better Readability */}
          <div className={`flex items-center justify-center space-x-4 ${contentClasses}`}>
            <div className="relative">
              <CurrentIcon className={iconClasses} />
              {/* Icon glow reflection */}
              <CurrentIcon 
                className={`
                  absolute top-0 left-0 ${iconClasses} opacity-20 blur-sm 
                  transform scale-150 -z-10
                  ${transitioning ? 'animate-ping' : ''}
                `} 
              />
            </div>
            <h3 className={`${titleClasses} relative`}>
              {currentContent.title}
              {/* Text glow effect */}
              <span 
                className={`
                  absolute inset-0 ${titleClasses} opacity-30 blur-sm -z-10
                `}
              >
                {currentContent.title}
              </span>
            </h3>
          </div>
          
          {/* Enhanced Description with Better Contrast */}
          <div className="relative min-h-[3rem] flex items-center justify-center">
            <p className={`
              text-white/95 text-xs sm:text-sm md:text-base text-center font-medium
                              ${contentClasses} md:drop-shadow-sm leading-relaxed
            `}>
              {currentContent.description}
            </p>
          </div>
          
          {/* Enhanced Button with Better Visibility */}
          <div className="pt-1 flex justify-center">
            <div className="relative">
              <Button 
                to="/contact"
                variant="primary"
                size="small"
                showArrow
                className="relative z-10 hover:scale-105 transition-transform duration-200 font-semibold text-xs sm:text-sm"
              >
                Get in Touch
              </Button>
              {/* Button glow effect */}
              <div 
                className={`
                  absolute inset-0 rounded-md opacity-30 blur-sm -z-10
                  bg-gradient-to-r ${currentContent.gradientTheme}
                  transition-all duration-500
                `}
              />
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default CyclingExpertiseCard; 