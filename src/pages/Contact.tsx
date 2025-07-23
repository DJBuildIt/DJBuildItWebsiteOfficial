import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageLayout } from '@/components/layout';
import { Hero } from '@/components/sections';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useEmailJS, type ContactFormData } from '@/hooks/useEmailJS';
import { useSupabaseTracking } from '@/hooks/useSupabaseTracking';
import { contactFormSchema, serviceOptions } from '@/lib/validations';
import { formElementVariants } from '@/components/ui/FormField';
import { 
  TYPOGRAPHY, 
  COLORS, 
  LAYOUT, 
  BACKGROUND_IMAGES 
} from '@/lib/design-system';

// Success component for after form submission
const SuccessMessage: React.FC<{ onReset: () => void }> = ({ onReset }) => (
  <GlassCard variant="base" className="w-full max-w-lg text-center">
    <div className="space-y-6">
      <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-green-400" />
      </div>
      
      <div className="space-y-3">
        <h3 className={`${COLORS.text.brand} ${TYPOGRAPHY.section.primary}`}>
          Message Sent Successfully!
        </h3>
        <p className={`${COLORS.text.secondary} ${TYPOGRAPHY.body.regular}`}>
          Thank you for reaching out! I've received your message and will get back to you within 24 hours.
        </p>
        <p className={`${COLORS.text.muted} ${TYPOGRAPHY.body.small}`}>
          Check your email for a confirmation receipt.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button 
          onClick={onReset}
          variant="primary"
          size="medium"
        >
          Send Another Message
        </Button>
        <Button 
          to="/"
          variant="secondary"
          size="medium"
        >
          Back to Home
        </Button>
      </div>
    </div>
  </GlassCard>
);

// Main contact form component
const ContactForm: React.FC = () => {
  const { sendEmail, isSubmitting, status, errorMessage, resetStatus } = useEmailJS();
  const { trackContactSubmission, trackPageView, isInitialized } = useSupabaseTracking();
  const [showSuccess, setShowSuccess] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid }
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    mode: 'onChange' // Real-time validation
  });

  // Track page view when component mounts
  useEffect(() => {
    if (isInitialized) {
      trackPageView('/contact', 'Contact Form', 'contact');
    }
  }, [isInitialized, trackPageView]);

  const onSubmit = async (data: ContactFormData) => {
    setTrackingError(null);
    
    try {
      // DUAL-TRACK APPROACH: Both EmailJS and Supabase
      const [emailResult, trackingResult] = await Promise.allSettled([
        sendEmail(data), // Existing EmailJS functionality
        isInitialized ? trackContactSubmission({
          name: data.from_name,
          email: data.from_email,
          service_type: data.service_type,
          message: data.message
        }) : Promise.resolve({ success: false, error: 'Tracking not initialized' })
      ]);

      // Check EmailJS result (critical for user experience)
      const emailSuccess = emailResult.status === 'fulfilled' && emailResult.value.success;
      
      // Log tracking result but don't block user experience
      if (trackingResult.status === 'rejected' || 
          (trackingResult.status === 'fulfilled' && !trackingResult.value.success)) {
        console.warn('Contact tracking failed:', trackingResult);
        setTrackingError('Analytics tracking failed, but your message was sent successfully.');
      }

      if (emailSuccess) {
        reset(); // Clear form
        setShowSuccess(true);
        
        // Auto-hide success message after 10 seconds
        setTimeout(() => {
          setShowSuccess(false);
          resetStatus();
          setTrackingError(null);
        }, 10000);
      }
    } catch (error) {
      console.error('Contact form submission error:', error);
    }
  };

  const handleReset = () => {
    setShowSuccess(false);
    resetStatus();
    reset();
  };

  // Show success message
  if (showSuccess) {
    return <SuccessMessage onReset={handleReset} />;
  }

  return (
    <GlassCard variant="base" className="w-full max-w-lg">
      <div className="space-y-6">
        <div className="text-center">
          <h3 className={`${COLORS.finance.primary} ${TYPOGRAPHY.section.primary} !font-bold`}>
            Send Message
          </h3>
          <p className={`${COLORS.text.muted} ${TYPOGRAPHY.body.small} mt-2`}>
            Fill out the form below and I'll get back to you soon.
          </p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Name Field */}
          <div>
            <label className={`block ${COLORS.text.secondary} ${TYPOGRAPHY.label.small} mb-2`}>
              Full Name *
            </label>
            <input 
              {...register('from_name')}
              type="text"
              className={formElementVariants({ 
                intent: errors.from_name ? 'error' : 'default' 
              })}
              placeholder="Your full name"
              autoComplete="name"
            />
            {errors.from_name && (
              <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.from_name.message}
              </p>
            )}
          </div>
          
          {/* Email Field */}
          <div>
            <label className={`block ${COLORS.text.secondary} ${TYPOGRAPHY.label.small} mb-2`}>
              Email Address *
            </label>
            <input 
              {...register('from_email')}
              type="email"
              className={formElementVariants({
                intent: errors.from_email ? 'error' : 'default'
              })}
              placeholder="your@email.com"
              autoComplete="email"
            />
            {errors.from_email && (
              <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.from_email.message}
              </p>
            )}
          </div>
          
          {/* Service Type Field */}
          <div>
            <label className={`block ${COLORS.text.secondary} ${TYPOGRAPHY.label.small} mb-2`}>
              Service Interest *
            </label>
            <select 
              {...register('service_type')}
              className={formElementVariants({
                intent: errors.service_type ? 'error' : 'default'
              })}
            >
              <option value="" className="bg-gray-800 text-gray-300">
                Select a service...
              </option>
              {serviceOptions.map((option) => (
                <option 
                  key={option.value} 
                  value={option.value}
                  className="bg-gray-800 text-white"
                >
                  {option.label}
                </option>
              ))}
            </select>
            {errors.service_type && (
              <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.service_type.message}
              </p>
            )}
          </div>
          
          {/* Message Field */}
          <div>
            <label className={`block ${COLORS.text.secondary} ${TYPOGRAPHY.label.small} mb-2`}>
              Message *
            </label>
            <textarea 
              {...register('message')}
              rows={4}
              className={`${formElementVariants({
                intent: errors.message ? 'error' : 'default'
              })} resize-none`}
              placeholder="Tell me about your project, goals, or how I can help you..."
            />
            {errors.message && (
              <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.message.message}
              </p>
            )}
          </div>
          
          {/* Submit Button - Aligned Right and Bold */}
          <div className="flex justify-end">
            <Button 
              type="submit"
              disabled={isSubmitting || !isValid}
              variant="primary"
              size="medium"
              className="!font-bold [&>*]:!font-bold"
              showArrow={!isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="!font-bold">Sending Message...</span>
                </>
              ) : (
                <span className="!font-bold">Send Message</span>
              )}
            </Button>
          </div>

          {/* Error Message */}
          {status === 'error' && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-md p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-medium">Failed to send message</p>
                  <p className="text-red-300 text-sm mt-1">{errorMessage}</p>
                  <p className="text-red-300 text-sm mt-2">
                    Alternative: Email me directly at{' '}
                    <a 
                      href="mailto:hello@djbuildit.com" 
                      className="underline hover:text-red-200"
                    >
                      hello@djbuildit.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tracking Warning (Non-blocking) */}
          {trackingError && status !== 'error' && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-md p-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-300 text-sm">{trackingError}</p>
              </div>
            </div>
          )}

          {/* Form Footer */}
          <div className="text-center">
            <p className={`${COLORS.text.muted} ${TYPOGRAPHY.body.small}`}>
              * Required fields. I typically respond within 24 hours.
            </p>
          </div>
        </form>
      </div>
    </GlassCard>
  );
};

// Main Contact page component
const Contact: React.FC = () => {
  return (
    <PageLayout backgroundImage={BACKGROUND_IMAGES.contact} overlayType="light">
      <Hero size="secondary">
        <div className={LAYOUT.grid.main}>
          {/* Hero Content - Left Side */}
          <div className={`${LAYOUT.columns.hero} space-y-8`}>
            <h1 className={`${TYPOGRAPHY.hero.tertiary} ${COLORS.text.primary}`}>
              <div className={TYPOGRAPHY.spacing.hero}>
                <span className={COLORS.finance.primary}>LET'S</span>
              </div>
              <div className={TYPOGRAPHY.spacing.hero}>BUILD</div>
              <div>TOGETHER.</div>
            </h1>

            {/* Contact Info */}
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className={`${TYPOGRAPHY.section.secondary} ${COLORS.finance.primary}`}>
                  GET IN TOUCH
                </h2>
                <p className={`${COLORS.text.secondary} ${TYPOGRAPHY.body.regular}`}>
                  Ready to start your project? Whether you need financial consulting, 
                  fitness coaching, or app development, I'm here to help bring your vision to life.
                </p>
              </div>



              <div className="space-y-3">
                <h2 className={`${TYPOGRAPHY.section.secondary} ${COLORS.finance.primary}`}>
                  RESPONSE TIME
                </h2>
                <p className={`${COLORS.text.secondary} ${TYPOGRAPHY.body.regular}`}>
                  I typically respond to all inquiries within 24 hours. 
                  For urgent requests, please mention "URGENT" in your subject line.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className={`${TYPOGRAPHY.section.secondary} ${COLORS.finance.primary}`}>
                  WHAT TO EXPECT
                </h2>
                <ul className={`${COLORS.text.secondary} ${TYPOGRAPHY.body.regular} space-y-2`}>
                  <li>• Personalized response to your specific needs</li>
                  <li>• Clear next steps and project timeline</li>
                  <li>• Transparent pricing and scope discussion</li>
                  <li>• Professional consultation to understand your goals</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact Form - Right Side */}
          <div className={`${LAYOUT.columns.contentNarrow} flex items-center justify-center lg:justify-end`}>
            <ContactForm />
          </div>
        </div>
      </Hero>
    </PageLayout>
  );
};

export default Contact;
