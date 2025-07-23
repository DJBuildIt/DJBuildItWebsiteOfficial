import React from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout';
import { Hero } from '@/components/sections';
import CyclingExpertiseCard from '@/components/ui/CyclingExpertiseCard';
import { 
  TYPOGRAPHY, 
  COLORS, 
  LAYOUT, 
  BACKGROUND_IMAGES,
  ANIMATIONS 
} from '@/lib/design-system';

const Index: React.FC = () => {
  return (
    <PageLayout backgroundImage={BACKGROUND_IMAGES.home} overlayType="light">
      <Hero size="primary">
        <div className={LAYOUT.grid.main}>
          {/* Hero Content - Left Side */}
          <div className={`${LAYOUT.columns.hero} space-y-8`}>
            <h1 className={`${TYPOGRAPHY.hero.compact} ${COLORS.text.primary} text-center md:text-left`}>
              <div className={TYPOGRAPHY.spacing.hero}>
                <span className={COLORS.text.brand}>BUILDING</span>
              </div>
              <Link 
                to="/apps" 
                className={`block ${TYPOGRAPHY.spacing.hero} hover-gradient-text ${ANIMATIONS.transition.all} cursor-pointer`}
                data-text="APPS"
              >
                APPS
              </Link>
              <Link 
                to="/fitness" 
                className={`block ${TYPOGRAPHY.spacing.hero} ${ANIMATIONS.transition.colors} hover:text-emerald-400 cursor-pointer`}
              >
                MUSCLES
              </Link>
              <Link 
                to="/finance" 
                className={`block ${TYPOGRAPHY.spacing.hero} ${ANIMATIONS.transition.colors} hover:text-blue-400 cursor-pointer`}
              >
                FORECASTS
              </Link>
            </h1>
          </div>

          {/* Cycling Expertise Card - Right Side */}
          <div className={`${LAYOUT.columns.contentNarrow} flex items-center justify-center lg:justify-end`}>
            <CyclingExpertiseCard />
          </div>
        </div>
      </Hero>
    </PageLayout>
  );
};

export default Index;
