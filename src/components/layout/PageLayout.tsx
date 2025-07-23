import React from 'react';
import { COLORS, LAYOUT, MOBILE_LAYOUT } from '@/lib/design-system';
import Header from './Header';
import Footer from './Footer';

interface PageLayoutProps {
  children: React.ReactNode;
  backgroundImage: string;
  overlayType?: 'light' | 'medium' | 'strong';
  className?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  backgroundImage,
  overlayType = 'medium',
  className = '',
}) => {
  const overlayClass = COLORS.overlay[overlayType];

  const backgroundStyles = {
    backgroundImage: `url('${backgroundImage}')`,
    backgroundSize: '100% 100%'
  };

  return (
    <div className={`relative min-h-screen flex flex-col ${className}`}>
      {/* Background Image with Overlay - Fixed size to prevent mobile zoom */}
      <div 
        className="fixed inset-0 bg-center bg-no-repeat"
        style={backgroundStyles}
      >
        <div className={`absolute inset-0 ${overlayClass}`} />
      </div>

      {/* Header */}
      <Header />

      {/* Main Content Area with proper header spacing */}
      <main 
        className="flex-grow pt-16 sm:pt-16 md:pt-18 lg:pt-20"
        style={backgroundStyles}
      >
        {/* Content wrapper with proper spacing */}
        <div className="relative min-h-full">
          {children}
        </div>
      </main>

      {/* Footer - Will be pushed to bottom by flex-grow on main */}
      <Footer />
    </div>
  );
};

export default PageLayout; 