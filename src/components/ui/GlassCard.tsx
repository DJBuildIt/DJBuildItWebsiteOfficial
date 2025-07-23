import React from 'react';
import { COMPONENT_PATTERNS, ANIMATIONS } from '@/lib/design-system';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'base' | 'compact';
  hover?: boolean;
  className?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'base',
  hover = true,
  className = '',
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const baseClass = COMPONENT_PATTERNS.card[variant];
  const hoverClass = hover ? ANIMATIONS.hover.scaleSmall : '';
  const clickableClass = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${baseClass} ${hoverClass} ${clickableClass} ${className}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
};

