import React from 'react';
import { LAYOUT } from '@/lib/design-system';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'small' | 'normal' | 'large';
  container?: 'tight' | 'normal' | 'wide';
}

const Section: React.FC<SectionProps> = ({
  children,
  className = '',
  spacing = 'normal',
  container = 'normal',
}) => {
  const spacingClasses = {
    small: LAYOUT.spacing.sectionSmall,
    normal: LAYOUT.spacing.section,
    large: 'py-16 sm:py-20 md:py-24 lg:py-32',
  };

  const containerClasses = {
    tight: LAYOUT.containerTight,
    normal: LAYOUT.container,
    wide: LAYOUT.containerWide,
  };

  return (
    <section className={`${spacingClasses[spacing]} ${containerClasses[container]} ${className}`}>
      {children}
    </section>
  );
};

export default Section; 