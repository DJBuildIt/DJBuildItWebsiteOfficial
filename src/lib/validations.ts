import { z } from 'zod';

// Contact form validation schema with comprehensive rules
export const contactFormSchema = z.object({
  from_name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
    
  from_email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(100, 'Email must be less than 100 characters')
    .toLowerCase(),
    
  service_type: z.enum(['fitness', 'finance', 'apps', 'general'], {
    required_error: 'Please select a service',
    invalid_type_error: 'Please select a valid service option'
  }),
  
  message: z
    .string()
    .min(1, 'Message is required')
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters')
    .trim()
});

// Infer the TypeScript type from the schema
export type ContactFormData = z.infer<typeof contactFormSchema>;

// Service type options for form dropdown
export const serviceOptions = [
  { value: 'fitness', label: 'Fitness Coaching' },
  { value: 'finance', label: 'Financial Consulting' },
  { value: 'apps', label: 'App Development' },
  { value: 'general', label: 'General Inquiry' }
] as const;

// Helper function to get service label from value
export const getServiceLabel = (value: string): string => {
  const option = serviceOptions.find(opt => opt.value === value);
  return option?.label || value;
};

// Additional validation helpers
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
}; 