import React from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout';
import { Hero, Section } from '@/components/sections';
import GlassCard from '@/components/ui/GlassCard';
import { 
  TYPOGRAPHY, 
  COLORS, 
  LAYOUT, 
  BACKGROUND_IMAGES,
  ANIMATIONS 
} from '@/lib/design-system';

interface AppProject {
  name: string;
  role: string;
  tech: string;
  description: string;
  link: string;
}

const Apps: React.FC = () => {
  const apps: AppProject[] = [
    {
      name: "Serious Fit",
      role: "Founder, Vibe Coder",
      tech: "V0, Lovable, GPT, Gemini Pro 2.5",
      description: "Real-time financial analytics platform with AI-powered insights",
      link: "#"
    },
    {
      name: "FIT Research Pro",
      role: "Founder, Vibe Coder",
      tech: "V0, Lovable, GPT, Gemini Pro 2.5, Python",
      description: "Comprehensive Fitness & Health Research Platform - backed by Science",
      link: "#"
    },
    {
      name: "Project Arcanum",
      role: "Founder, Vibe Coder",
      tech: "V0, Lovable, GPT, Gemini Pro 2.5",
      description: "Suite of tools for indie hackers & vibe coders",
      link: "#"
    }
  ];

  return (
    <PageLayout backgroundImage={BACKGROUND_IMAGES.apps} overlayType="strong">
      <Hero size="secondary">
        <div className={LAYOUT.grid.main}>
          {/* Hero Content - Left Side */}
          <div className={`${LAYOUT.columns.hero} space-y-8`}>
            <h1 className={`${TYPOGRAPHY.hero.tertiary} ${COLORS.text.primary} text-center md:text-left`}>
              <div className={TYPOGRAPHY.spacing.hero}>
                <span className={COLORS.text.brand}>BUILDING</span>
              </div>
              <div className={TYPOGRAPHY.spacing.hero}>IDEAS</div>
              <div className={TYPOGRAPHY.spacing.hero}>INTO</div>
              <div className={TYPOGRAPHY.spacing.hero}>APPS.</div>
            </h1>

            {/* Content Sections */}
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className={`${TYPOGRAPHY.section.secondary} ${COLORS.text.brand}`}>
                  Vibe Coding
                </h2>
                <p className={`${COLORS.text.secondary} ${TYPOGRAPHY.body.regular}`}>
                  Using tools like Lovable, V0, Bolt, Replit, Cursor, UXPilot.AI and more. 
                  Trying to elevate my vibe coded apps to be scalable, secure, and polished, 
                  with beautiful UI/UX.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className={`${TYPOGRAPHY.section.secondary} ${COLORS.text.brand}`}>
                  Health and Fitness Focus
                </h2>
                <p className={`${COLORS.text.secondary} ${TYPOGRAPHY.body.regular}`}>
                  My fitness career has given me great insights into the fitness and health industry. 
                  There are many problems and inefficiencies. It is my goal to solve these problems, 
                  and help people become more fit and healthy.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className={`${TYPOGRAPHY.section.secondary} ${COLORS.text.brand}`}>
                  Future Plans
                </h2>
                <p className={`${COLORS.text.secondary} ${TYPOGRAPHY.body.regular}`}>
                  Finish building my Fitness Research App and scale it to 200+ users by the end of September. 
                  Launch SeriousFit, a psychology-based fitness app by the end of July. 
                  Build a platform for solo builders to market their ideas and apps to Venture Capitalists.
                </p>
              </div>
            </div>
          </div>

          {/* Project Cards - Right Side Vertical Layout - Smaller and Compact */}
          <div className={`${LAYOUT.columns.contentNarrow} flex items-center justify-center lg:justify-end`}>
            <div className="w-full max-w-lg space-y-6">
              <h2 className={`${TYPOGRAPHY.section.secondary} ${COLORS.text.brand} text-center`}>
                Current Projects
              </h2>
              <div className="space-y-4">
                {apps.map((app, index) => (
                  <GlassCard 
                    key={index} 
                    variant="base"
                    className="space-y-3 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => window.location.href = app.link}
                  >
                    <h3 className={`${COLORS.text.brand} ${TYPOGRAPHY.label.primary} font-bold`}>
                      {app.name}
                    </h3>
                    
                    <div className="space-y-1">
                      <p className={`${COLORS.text.muted} ${TYPOGRAPHY.label.small}`}>
                        {app.role}
                      </p>
                      <p className={`${COLORS.text.accent} ${TYPOGRAPHY.body.small}`}>
                        {app.tech}
                      </p>
                    </div>

                    <p className={`${COLORS.text.secondary} ${TYPOGRAPHY.body.small}`}>
                      {app.description}
                    </p>
                  </GlassCard>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Hero>
    </PageLayout>
  );
};

export default Apps;
