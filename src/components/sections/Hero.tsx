import React, { useEffect, useState } from 'react';
import { TYPOGRAPHY, COLORS, ANIMATIONS, LAYOUT } from '@/lib/design-system';

interface HeroProps {
  children: React.ReactNode;
  size?: 'primary' | 'secondary' | 'tertiary';
  className?: string;
  loaded?: boolean;
}

const Hero: React.FC<HeroProps> = ({
  children,
  size = 'primary',
  className = '',
  loaded: externalLoaded,
}) => {
  const [internalLoaded, setInternalLoaded] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setInternalLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const loaded = externalLoaded !== undefined ? externalLoaded : internalLoaded;
  
  // Updated size classes with proper mobile-first responsive heights using dvh
  // These account for actual header/footer heights across different breakpoints
  const sizeClasses = {
    primary: 'min-h-[calc(100dvh-12rem)] sm:min-h-[calc(100dvh-12rem)] md:min-h-[calc(100dvh-14rem)] flex items-center justify-center',
    secondary: 'min-h-[calc(100dvh-14rem)] sm:min-h-[calc(100dvh-14rem)] md:min-h-[calc(100dvh-16rem)] flex items-center justify-center', 
    tertiary: 'min-h-[calc(100dvh-14rem)] sm:min-h-[calc(100dvh-14rem)] md:min-h-[calc(100dvh-16rem)] flex items-center justify-center',
  };

  const animationClasses = loaded 
    ? `${ANIMATIONS.loading.fadeInActive} ${ANIMATIONS.timing.slowest}`
    : `${ANIMATIONS.loading.fadeIn} ${ANIMATIONS.timing.slowest}`;

  return (
    <section className={`${sizeClasses[size]} ${LAYOUT.container} ${className}`}>
      <div className={`w-full ${animationClasses}`}>
        {children}
      </div>
    </section>
  );
};

export default Hero; 