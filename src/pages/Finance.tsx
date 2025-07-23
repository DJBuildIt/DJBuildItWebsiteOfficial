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

const Finance: React.FC = () => {
  return (
    <PageLayout backgroundImage={BACKGROUND_IMAGES.finance} overlayType="medium">
      <Hero size="secondary">
        <div className={LAYOUT.grid.main}>
          {/* Hero Content - Left Side */}
          <div className={`${LAYOUT.columns.hero} space-y-8`}>
            <h1 className={`${TYPOGRAPHY.hero.tertiary} ${COLORS.text.primary}`}>
              <div className={TYPOGRAPHY.spacing.hero}>
                <span className={COLORS.finance.primary}>BUILDING</span>
              </div>
              <div className={TYPOGRAPHY.spacing.hero}>FINANCIAL</div>
              <div>BLUEPRINTS.</div>
            </h1>

            {/* Content Sections */}
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className={`${TYPOGRAPHY.section.secondary} ${COLORS.finance.primary}`}>
                  FORECASTING & MODELING
                </h2>
                <p className={`${COLORS.text.secondary} ${TYPOGRAPHY.body.regular}`}>
                  Advanced financial modeling, scenario planning, and forecasting. 
                  Building comprehensive financial blueprints that guide strategic decision-making. Vast experience in budget vs actuals analysis, cash burn management, and more.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className={`${TYPOGRAPHY.section.secondary} ${COLORS.finance.primary}`}>
                  CFA CHARTERHOLDER
                </h2>
                <p className={`${COLORS.text.secondary} ${TYPOGRAPHY.body.regular}`}>
                  Chartered Financial Analyst with deep expertise in equity research, 
                  financial modeling, and investment analysis.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className={`${TYPOGRAPHY.section.secondary} ${COLORS.finance.primary}`}>
                 Tech Startup Financial Consulting 
                </h2>
                <p className={`${COLORS.text.secondary} ${TYPOGRAPHY.body.regular}`}>
                  I work directly with founders, CEOs, and CFOs of high-growth tech startups to help them craft hiring plans, forecast revenue and expenses, and make more sound business decisions. 
                </p>
              </div>
            </div>
          </div>

          {/* Bio Card - Right Side */}
          <div className={`${LAYOUT.columns.contentNarrow} flex items-center justify-center lg:justify-end`}>
            <GlassCard variant="base" className="w-full max-w-lg">
              <div className="space-y-6 text-center">
                <h3 className={`${COLORS.finance.primary} ${TYPOGRAPHY.section.primary} !font-medium`}>
                  Financial Advisory
                </h3>
                <p className={`${COLORS.text.secondary} ${TYPOGRAPHY.body.regular}`}>
                  With 8+ years of equity research and financial consulting experience, I specialize in 
                  building comprehensive financial models and investment strategies. From startup fundraising 
                  to complex financial analysis, I help businesses make data-driven decisions with confidence.
                </p>
                <div className="pt-4 flex justify-center">
                  <Button 
                    to="/contact"
                    variant="primary"
                    size="medium"
                    showArrow
                  >
                    Get in Touch
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

export default Finance;
