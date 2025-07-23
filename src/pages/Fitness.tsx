import React from 'react';
import { PageLayout } from '@/components/layout';
import { Hero } from '@/components/sections';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/button';
import { 
  TYPOGRAPHY, 
  COLORS, 
  LAYOUT, 
  BACKGROUND_IMAGES 
} from '@/lib/design-system';

const Fitness: React.FC = () => {
  return (
    <PageLayout backgroundImage={BACKGROUND_IMAGES.fitness} overlayType="medium">
      <Hero size="secondary">
        <div className={LAYOUT.grid.main}>
          {/* Hero Content - Left Side */}
          <div className={`${LAYOUT.columns.hero} space-y-8`}>
            <h1 className={`${TYPOGRAPHY.hero.tertiary} ${COLORS.text.primary}`}>
              <div className={TYPOGRAPHY.spacing.hero}>
              <span className={`bg-gradient-to-r ${COLORS.fitness.gradient} bg-clip-text text-transparent`}>BUILDING</span>
              </div>
              <div className={TYPOGRAPHY.spacing.hero}>STRENGTH.</div>
              <div className={TYPOGRAPHY.spacing.hero}>ENDURANCE.</div>
              <div>CONSISTENCY.</div>
            </h1>

            {/* Content Sections */}
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className={`${TYPOGRAPHY.section.secondary} bg-gradient-to-r ${COLORS.fitness.gradient} bg-clip-text text-transparent`}>
                  PERSONAL TRAINING
                </h2>
                <p className={`${COLORS.text.secondary} ${TYPOGRAPHY.body.regular}`}>
                  NASM Certified Personal Trainer specializing in strength training, 
                  body composition, and sustainable fitness habits that last a lifetime.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className={`${TYPOGRAPHY.section.secondary} bg-gradient-to-r ${COLORS.fitness.gradient} bg-clip-text text-transparent`}>
                  NO BS APPROACH
                </h2>
                <p className={`${COLORS.text.secondary} ${TYPOGRAPHY.body.regular}`}>
                  I don't believe in fads or gimmicks. I believe in hard work, consistency, and a great mindset. Everything I do is based on years of research and experience, and logically makes sense.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className={`${TYPOGRAPHY.section.secondary} bg-gradient-to-r ${COLORS.fitness.gradient} bg-clip-text text-transparent`}>
                  CUSTOMIZED PROGRAMS
                </h2>
                <p className={`${COLORS.text.secondary} ${TYPOGRAPHY.body.regular}`}>
                  No two clients are the same, so why should their programs be? I create custom programs for each client based on their goals, lifestyle, and current fitness level.
                </p>
              </div>
            </div>
          </div>

          {/* Bio Card - Right Side */}
          <div className={`${LAYOUT.columns.contentNarrow} flex items-center justify-center lg:justify-end`}>
            <GlassCard variant="base" className="w-full max-w-lg">
              <div className="space-y-6 text-center">
                <h3 className={`bg-gradient-to-r ${COLORS.fitness.gradient} bg-clip-text text-transparent ${TYPOGRAPHY.section.primary} !font-medium`}>
                  Fitness Coaching
                </h3>
                <p className={`${COLORS.text.secondary} ${TYPOGRAPHY.body.regular}`}>
                  As a NASM Certified Personal Trainer and former NPC competitor, I help clients 
                  build strength, improve body composition, and develop sustainable fitness habits. 
                  From beginners to advanced athletes, I create personalized programs that deliver results.
                </p>
                <div className="pt-4 flex justify-center">
                  <Button 
                    to="/contact"
                    variant="primary"
                    size="medium"
                    showArrow
                  >
                    Start Training
                  </Button>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </Hero>
    </PageLayout>
  );
};

export default Fitness;
