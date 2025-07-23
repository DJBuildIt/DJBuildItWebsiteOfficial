import { useState, useCallback, useEffect } from 'react';
import { postAnalyticsEvent } from '@/lib/analytics-client';
import { SupabaseService } from '@/lib/supabase-complete'; // still used for advanced server-side actions (contact form, etc.)

// Simple UUID v4 generator (no external dependency needed)
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Generate unique session ID for user tracking
const generateSessionId = (): string => {
  const existing = sessionStorage.getItem('djbuildit_session_id');
  if (existing) return existing;
  
  const newSessionId = generateUUID();
  sessionStorage.setItem('djbuildit_session_id', newSessionId);
  return newSessionId;
};

// Detect device type from user agent
const detectDeviceType = (userAgent: string): 'mobile' | 'tablet' | 'desktop' => {
  if (/Mobi|Android/i.test(userAgent)) return 'mobile';
  if (/Tablet|iPad/i.test(userAgent)) return 'tablet';
  return 'desktop';
};

// Detect browser from user agent
const detectBrowser = (userAgent: string): string => {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
};

// Detect OS from user agent
const detectOS = (userAgent: string): string => {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('iOS')) return 'iOS';
  if (userAgent.includes('Android')) return 'Android';
  return 'Unknown';
};

// Parse UTM parameters from URL
const getUTMParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    utm_source: urlParams.get('utm_source'),
    utm_medium: urlParams.get('utm_medium'),
    utm_campaign: urlParams.get('utm_campaign'),
    utm_term: urlParams.get('utm_term'),
    utm_content: urlParams.get('utm_content'),
  };
};

interface TrackingData {
  sessionId: string;
  customerId?: string;
  userAgent?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  operatingSystem?: string;
  referrer?: string;
  utmParams?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  };
}

export const useSupabaseTracking = () => {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize tracking on hook mount
  useEffect(() => {
    const initializeTracking = async () => {
      try {
        const sessionId = generateSessionId();
        const userAgent = navigator.userAgent;
        const deviceType = detectDeviceType(userAgent);
        const browser = detectBrowser(userAgent);
        const operatingSystem = detectOS(userAgent);
        const referrer = document.referrer;
        const utmParams = getUTMParams();

        const trackingInfo: TrackingData = {
          sessionId,
          userAgent,
          deviceType,
          browser,
          operatingSystem,
          referrer: referrer || undefined,
          utmParams,
        };

        setTrackingData(trackingInfo);

        // Send session start event to the server-side analytics endpoint
        await postAnalyticsEvent({
          eventType: 'session_start',
          category: 'session',
          sessionId,
          timestamp: Date.now(),
          data: {
            referrer,
            utm: utmParams,
          },
          context: {
            userAgent,
            deviceType,
            browser,
            operatingSystem,
            url: window.location.href,
          },
        });

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize tracking:', error);
        setIsInitialized(true); // Still mark as initialized to not block the app
      }
    };

    initializeTracking();
  }, []);

  // Track page view
  const trackPageView = useCallback(async (
    pagePath: string,
    pageTitle?: string,
    pageCategory?: string,
    loadTime?: number
  ) => {
    if (!trackingData || !isInitialized) return;

    try {
      await postAnalyticsEvent({
        eventType: 'page_view',
        category: 'page',
        sessionId: trackingData.sessionId,
        userId: customerId || undefined,
        timestamp: Date.now(),
        data: {
        page_path: pagePath,
        page_title: pageTitle,
        page_category: pageCategory,
        load_time: loadTime,
        },
        context: {
          url: window.location.href,
        },
      });
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }, [trackingData, customerId, isInitialized]);

  // Track custom event
  const trackEvent = useCallback(async (
    eventType: string,
    eventCategory: string,
    eventAction: string,
    eventLabel?: string,
    eventData?: any,
    eventValue?: number
  ) => {
    if (!trackingData || !isInitialized) return;

    try {
      await postAnalyticsEvent({
        eventType,
        category: eventCategory,
        sessionId: trackingData.sessionId,
        userId: customerId || undefined,
        timestamp: Date.now(),
        data: {
          action: eventAction,
          label: eventLabel,
          ...eventData,
        },
        context: {
          url: window.location.pathname,
        },
        revenue: eventValue ? { value: eventValue, currency: 'USD' } : undefined,
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }, [trackingData, customerId, isInitialized]);

  // Enhanced contact form submission with Supabase tracking
  const trackContactSubmission = useCallback(async (contactData: {
    name: string;
    email: string;
    service_type: 'fitness' | 'finance' | 'apps' | 'general';
    message: string;
  }) => {
    if (!trackingData || !isInitialized) {
      throw new Error('Tracking not initialized');
    }

    try {
      // First, create or update customer record
      const newCustomerId = await SupabaseService.createOrUpdateCustomer({
        email: contactData.email,
        name: contactData.name,
        session_id: trackingData.sessionId,
        user_agent: trackingData.userAgent,
        acquisition_source: trackingData.utmParams?.utm_source || 'direct',
        acquisition_campaign: trackingData.utmParams?.utm_campaign,
      });

      setCustomerId(newCustomerId);

      // Then, submit contact form data
      const submission = await SupabaseService.submitContactForm({
        name: contactData.name,
        email: contactData.email,
        service_type: contactData.service_type,
        message: contactData.message,
        session_id: trackingData.sessionId,
        user_agent: trackingData.userAgent,
        referrer: trackingData.referrer,
        utm_source: trackingData.utmParams?.utm_source || undefined,
        utm_medium: trackingData.utmParams?.utm_medium || undefined,
        utm_campaign: trackingData.utmParams?.utm_campaign || undefined,
      });

      // Track the contact form submission event
      await trackEvent(
        'contact_form_submitted',
        'lead_generation',
        'form_submission',
        contactData.service_type,
        {
          customer_id: newCustomerId,
          submission_id: submission.id,
          form_version: '2.0',
        }
      );

      return {
        success: true,
        customerId: newCustomerId,
        submissionId: submission.id,
      };
    } catch (error) {
      console.error('Failed to track contact submission:', error);
      throw error;
    }
  }, [trackingData, isInitialized, trackEvent]);

  // Track cart events
  const trackCartEvent = useCallback(async (
    eventType: 'cart_viewed' | 'add_to_cart' | 'remove_from_cart' | 'cart_abandoned' | 'checkout_started',
    cartData: {
      cartToken: string;
      items: any[];
      itemCount: number;
      cartValue: number;
      productId?: string;
      productName?: string;
      quantity?: number;
    }
  ) => {
    if (!trackingData || !isInitialized) return;

    try {
      // Send cart-related event to analytics endpoint
      await postAnalyticsEvent({
        eventType,
        category: 'ecommerce',
        sessionId: trackingData.sessionId,
        userId: customerId || undefined,
        timestamp: Date.now(),
        data: {
          cart_token: cartData.cartToken,
          product_id: cartData.productId,
          product_name: cartData.productName,
          quantity: cartData.quantity,
          cart_value: cartData.cartValue,
          item_count: cartData.itemCount,
          items: cartData.items,
        },
      });
    } catch (error) {
      console.error('Failed to track cart event:', error);
    }
  }, [trackingData, customerId, isInitialized, trackEvent]);

  // Track product view
  const trackProductView = useCallback(async (productId: string, productName: string, productPrice: number) => {
    await trackEvent(
      'product_viewed',
      'ecommerce',
      'product view',
      productName,
      {
        product_id: productId,
        product_name: productName,
        product_price: productPrice,
      },
      productPrice
    );
  }, [trackEvent]);

  // Track purchase completion
  const trackPurchase = useCallback(async (orderData: {
    orderId: string;
    orderNumber: string;
    customerId: string;
    totalAmount: number;
    items: any[];
    stripeSessionId?: string;
    stripePaymentIntentId?: string;
  }) => {
    if (!trackingData || !isInitialized) return;

    try {
      // Track purchase event
      await trackEvent(
        'purchase_completed',
        'ecommerce',
        'purchase',
        orderData.orderNumber,
        {
          order_id: orderData.orderId,
          order_number: orderData.orderNumber,
          customer_id: orderData.customerId,
          stripe_session_id: orderData.stripeSessionId,
          items: orderData.items,
        },
        orderData.totalAmount
      );

      // Update cart status via analytics event
      const cartToken = sessionStorage.getItem('cart_token');
      if (cartToken) {
        await postAnalyticsEvent({
          eventType: 'cart_converted',
          category: 'ecommerce',
          sessionId: trackingData.sessionId,
          userId: orderData.customerId,
          data: {
          cart_token: cartToken,
            order_id: orderData.orderId,
            value: orderData.totalAmount,
          },
        });
      }
    } catch (error) {
      console.error('Failed to track purchase:', error);
    }
  }, [trackingData, isInitialized, trackEvent]);

  return {
    // State
    isInitialized,
    sessionId: trackingData?.sessionId,
    customerId,
    trackingData,
    
    // Tracking functions
    trackPageView,
    trackEvent,
    trackContactSubmission,
    trackCartEvent,
    trackProductView,
    trackPurchase,
  };
}; 