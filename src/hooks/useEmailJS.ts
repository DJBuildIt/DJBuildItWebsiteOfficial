import { useState, useCallback } from 'react';
import emailjs from '@emailjs/browser';
import { security } from '@/lib/security';

interface ContactFormData {
  from_name: string;
  from_email: string;
  service_type: 'fitness' | 'finance' | 'apps' | 'general';
  message: string;
}

interface EmailJSResponse {
  success: boolean;
  error?: Error | unknown;
  message?: string;
}

// Client-side rate limiting to prevent abuse
class ClientRateLimit {
  private lastSubmission: number = 0;
  private submissionCount: number = 0;
  private resetTime: number = Date.now() + 60 * 60 * 1000; // 1 hour

  canSubmit(): boolean {
    const now = Date.now();
    
    // Reset counter if window has passed
    if (now > this.resetTime) {
      this.submissionCount = 0;
      this.resetTime = now + 60 * 60 * 1000;
    }

    // Check minimum time between submissions (30 seconds)
    if (now - this.lastSubmission < 30 * 1000) {
      return false;
    }

    // Check max submissions per hour (3)
    if (this.submissionCount >= 3) {
      return false;
    }

    return true;
  }

  recordSubmission(): void {
    this.lastSubmission = Date.now();
    this.submissionCount++;
  }

  getTimeUntilNext(): number {
    const timeSinceLastSubmission = Date.now() - this.lastSubmission;
    const minInterval = 30 * 1000; // 30 seconds
    return Math.max(0, minInterval - timeSinceLastSubmission);
  }

  getTimeUntilReset(): number {
    return Math.max(0, this.resetTime - Date.now());
  }
}

const clientRateLimit = new ClientRateLimit();

export const useEmailJS = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const sendEmail = useCallback(async (formData: ContactFormData): Promise<EmailJSResponse> => {
    // Prevent multiple simultaneous submissions
    if (isSubmitting) {
      return { success: false, error: 'Submission already in progress', message: 'Please wait for the current submission to complete.' };
    }

    setIsSubmitting(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      // Client-side rate limiting check
      if (!clientRateLimit.canSubmit()) {
        const timeUntilNext = clientRateLimit.getTimeUntilNext();
        const timeUntilReset = clientRateLimit.getTimeUntilReset();
        
        let errorMsg = 'Too many submissions. ';
        if (timeUntilNext > 0) {
          errorMsg += `Please wait ${Math.ceil(timeUntilNext / 1000)} seconds before trying again.`;
        } else {
          errorMsg += `You've reached the hourly limit. Try again in ${Math.ceil(timeUntilReset / (60 * 1000))} minutes.`;
        }
        
        setStatus('error');
        setErrorMessage(errorMsg);
        setIsSubmitting(false);
        return { success: false, error: errorMsg, message: errorMsg };
      }

      // Client-side input validation
      const nameValidation = security.validateInput('string', formData.from_name, 50);
      if (!nameValidation.isValid) {
        const error = `Invalid name: ${nameValidation.errors.join(', ')}`;
        setStatus('error');
        setErrorMessage(error);
        setIsSubmitting(false);
        return { success: false, error, message: error };
      }

      const emailValidation = security.validateInput('email', formData.from_email);
      if (!emailValidation.isValid) {
        const error = `Invalid email: ${emailValidation.errors.join(', ')}`;
        setStatus('error');
        setErrorMessage(error);
        setIsSubmitting(false);
        return { success: false, error, message: error };
      }

      const messageValidation = security.validateInput('string', formData.message, 1000);
      if (!messageValidation.isValid) {
        const error = `Invalid message: ${messageValidation.errors.join(', ')}`;
        setStatus('error');
        setErrorMessage(error);
        setIsSubmitting(false);
        return { success: false, error, message: error };
      }

      // Validate environment variables
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        const error = 'EmailJS configuration missing. Please check environment variables.';
        setStatus('error');
        setErrorMessage(error);
        setIsSubmitting(false);
        console.error('EmailJS Config Error:', { serviceId: !!serviceId, templateId: !!templateId, publicKey: !!publicKey });
        return { success: false, error, message: error };
      }

      // Prepare sanitized form data
      const sanitizedData = {
        from_name: nameValidation.sanitizedValue,
        from_email: emailValidation.sanitizedValue,
        service_type: formData.service_type,
        message: messageValidation.sanitizedValue,
        to_name: 'DJBUILDIT',
        reply_to: emailValidation.sanitizedValue,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        client_ip: 'client-side', // Cannot get real IP on client side
      };

      // Send email using EmailJS with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Email send timeout')), 15000); // 15 second timeout
      });

      const emailPromise = emailjs.send(
        serviceId,
        templateId,
        sanitizedData,
        publicKey
      );

      const result = await Promise.race([emailPromise, timeoutPromise]) as any;

      if (result.status === 200) {
        clientRateLimit.recordSubmission();
        setStatus('success');
        setIsSubmitting(false);
        
        // Log successful submission for analytics
        console.log('Contact form submitted successfully', {
          service_type: formData.service_type,
          timestamp: new Date().toISOString(),
        });
        
        return { success: true, message: 'Email sent successfully!' };
      } else {
        throw new Error(`EmailJS returned status: ${result.status}`);
      }
    } catch (error: unknown) {
      console.error('EmailJS Error:', error);
      
      let errorMsg = 'Failed to send message. Please try again.';
      
      // Handle specific error types
      if (error && typeof error === 'object' && 'text' in error && typeof error.text === 'string') {
        if (error.text.includes('rate limit') || error.text.includes('quota')) {
          errorMsg = 'Service temporarily unavailable due to rate limiting. Please wait a moment before sending another message.';
        } else if (error.text.includes('invalid') || error.text.includes('unauthorized')) {
          errorMsg = 'Email service configuration error. Please contact support.';
        } else if (error.text.includes('blocked') || error.text.includes('spam')) {
          errorMsg = 'Message blocked by spam filter. Please modify your message and try again.';
        }
      } else if (error instanceof Error) {
        if (error.name === 'NetworkError' || error.message.includes('fetch') || error.message.includes('timeout')) {
          errorMsg = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMsg = 'Request timed out. Please try again.';
        }
      }

      setStatus('error');
      setErrorMessage(errorMsg);
      setIsSubmitting(false);
      
      return { success: false, error, message: errorMsg };
    }
  }, [isSubmitting]);

  const resetStatus = useCallback(() => {
    setStatus('idle');
    setErrorMessage('');
  }, []);

  const getRateLimitInfo = useCallback(() => {
    return {
      canSubmit: clientRateLimit.canSubmit(),
      timeUntilNext: clientRateLimit.getTimeUntilNext(),
      timeUntilReset: clientRateLimit.getTimeUntilReset(),
    };
  }, []);

  return { 
    sendEmail, 
    isSubmitting, 
    status, 
    errorMessage,
    resetStatus,
    getRateLimitInfo
  };
};

export type { ContactFormData }; 