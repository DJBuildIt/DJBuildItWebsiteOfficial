import React from 'react';
import { TYPOGRAPHY, COLORS, LAYOUT } from '@/lib/design-system';

interface PageHeaderProps {
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  align = 'center',
  className = '',
}) => {
  const alignmentClass = align === 'left' ? 'text-left' : 'text-center';
  const descriptionMaxWidth = align === 'left' ? '' : 'max-w-2xl mx-auto';

  return (
    <section className={`pt-16 pb-6 sm:pt-20 sm:pb-8 md:pt-24 md:pb-10 ${LAYOUT.container} ${className}`}>
      <div className={`${alignmentClass} space-y-4`}>
        <h1 className={`${TYPOGRAPHY.hero.secondary} ${COLORS.text.brand}`}>
          {title}
        </h1>
        {description && (
          <p className={`${TYPOGRAPHY.body.large} ${COLORS.text.muted} ${descriptionMaxWidth}`}>
            {description}
          </p>
        )}
      </div>
    </section>
  );
};

export default PageHeader; 