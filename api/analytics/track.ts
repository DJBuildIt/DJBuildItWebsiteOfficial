// Advanced Analytics Tracking API
// Centralized endpoint for collecting analytics data from all systems

import { monitoring } from '../../src/lib/monitoring';
import { security } from '../../src/lib/security';
import { customerExperience } from '../../src/lib/customer-experience';
import { resilience } from '../../src/lib/resilience';

// ============================================================================
// ANALYTICS CONFIGURATION
// ============================================================================

export const ANALYTICS_CONFIG = {
  // Data retention periods
  retention: {
    rawEvents: 90, // days
    aggregatedData: 365, // days
    customerData: 1095, // 3 years
  },
  
  // Event types
  eventTypes: {
    // E-commerce events
    page_view: 'navigation',
    product_view: 'engagement',
    add_to_cart: 'conversion',
    checkout_start: 'conversion',
    purchase: 'revenue',
    cart_abandonment: 'conversion',
    
    // Performance events
    api_call: 'performance',
    page_load: 'performance',
    error: 'performance',
    
    // Security events
    rate_limit: 'security',
    fraud_check: 'security',
    blocked_request: 'security',
    
    // System events
    circuit_breaker: 'system',
    dead_letter: 'system',
    webhook: 'system',
  },
  
  // Sampling rates for high-volume events
  sampling: {
    page_view: 0.1, // Sample 10% of page views
    api_call: 1.0, // Track all API calls
    error: 1.0, // Track all errors
  },
} as const;

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

interface AnalyticsEvent {
  // Core event data
  eventType: string;
  category: string;
  timestamp: number;
  sessionId?: string;
  userId?: string;
  
  // Event-specific data
  data: Record<string, any>;
  
  // Context data
  context: {
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
    url?: string;
    viewport?: { width: number; height: number };
    device?: 'mobile' | 'tablet' | 'desktop';
    browser?: string;
    os?: string;
  };
  
  // Performance data
  performance?: {
    responseTime?: number;
    loadTime?: number;
    renderTime?: number;
    networkLatency?: number;
  };
  
  // Business metrics
  revenue?: {
    value: number;
    currency: string;
    transactionId?: string;
  };
  
  // Custom metadata
  metadata?: Record<string, any>;
}

interface AnalyticsResponse {
  success: boolean;
  eventId?: string;
  error?: string;
  debug?: any;
}

// ============================================================================
// ANALYTICS PROCESSOR
// ============================================================================

class AnalyticsProcessor {
  private eventQueue: AnalyticsEvent[] = [];
  private processingInterval?: NodeJS.Timeout;
  
  constructor() {
    // Process events every 10 seconds
    this.processingInterval = setInterval(() => {
      this.processEventQueue();
    }, 10000);
  }

  // Track a single event
  async trackEvent(event: AnalyticsEvent): Promise<AnalyticsResponse> {
    try {
      // Apply sampling for high-volume events
      if (this.shouldSample(event)) {
        // Validate event data
        const validationResult = this.validateEvent(event);
        if (!validationResult.valid) {
          return {
            success: false,
            error: `Invalid event data: ${validationResult.errors.join(', ')}`,
          };
        }

        // Enrich event with additional context
        const enrichedEvent = await this.enrichEvent(event);
        
        // Add to processing queue
        this.eventQueue.push(enrichedEvent);
        
        // Process immediately for critical events
        if (this.isCriticalEvent(event)) {
          await this.processEvent(enrichedEvent);
        }

        // Update our monitoring systems
        this.updateMonitoringSystems(enrichedEvent);

        return {
          success: true,
          eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
      } else {
        // Event was sampled out
        return {
          success: true,
          eventId: 'sampled_out',
        };
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
      return {
        success: false,
        error: (error as Error).message,
        debug: process.env.NODE_ENV === 'development' ? error : undefined,
      };
    }
  }

  // Validate event data
  private validateEvent(event: AnalyticsEvent): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!event.eventType) errors.push('eventType is required');
    if (!event.category) errors.push('category is required');
    if (!event.timestamp) errors.push('timestamp is required');

    // Timestamp validation
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (event.timestamp > now + 60000) {
      errors.push('timestamp cannot be in the future');
    }
    if (event.timestamp < now - maxAge) {
      errors.push('timestamp is too old');
    }

    // Data validation
    if (event.data && typeof event.data !== 'object') {
      errors.push('data must be an object');
    }

    // Revenue validation
    if (event.revenue) {
      if (typeof event.revenue.value !== 'number' || event.revenue.value < 0) {
        errors.push('revenue.value must be a positive number');
      }
      if (!event.revenue.currency) {
        errors.push('revenue.currency is required when revenue is provided');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // Enrich event with additional context
  private async enrichEvent(event: AnalyticsEvent): Promise<AnalyticsEvent> {
    const enriched = { ...event };

    // Add server-side timestamp if not provided
    if (!enriched.timestamp) {
      enriched.timestamp = Date.now();
    }

    // Detect device type from user agent
    if (enriched.context?.userAgent) {
      enriched.context.device = this.detectDeviceType(enriched.context.userAgent);
      enriched.context.browser = this.detectBrowser(enriched.context.userAgent);
      enriched.context.os = this.detectOS(enriched.context.userAgent);
    }

    // Add geolocation data (if available)
    if (enriched.context?.ipAddress) {
      try {
        const geoData = await this.getGeolocation(enriched.context.ipAddress);
        enriched.context = { ...enriched.context, ...geoData };
      } catch (error) {
        // Geo lookup failed, continue without it
      }
    }

    // Add session information
    if (!enriched.sessionId && enriched.userId) {
      enriched.sessionId = `sess_${enriched.userId}_${Date.now()}`;
    }

    return enriched;
  }

  // Check if event should be sampled
  private shouldSample(event: AnalyticsEvent): boolean {
    const samplingRate = ANALYTICS_CONFIG.sampling[event.eventType as keyof typeof ANALYTICS_CONFIG.sampling] ?? 1.0;
    return Math.random() <= samplingRate;
  }

  // Check if event is critical and needs immediate processing
  private isCriticalEvent(event: AnalyticsEvent): boolean {
    const criticalEvents = ['error', 'fraud_check', 'purchase', 'security_breach'];
    return criticalEvents.includes(event.eventType);
  }

  // Update our monitoring systems with the event
  private updateMonitoringSystems(event: AnalyticsEvent): void {
    try {
      // Update monitoring system
      monitoring.trackConversion(event.eventType as any, event.revenue?.value);

      // Update customer experience if user-related
      if (event.userId && event.eventType in ['page_view', 'add_to_cart', 'purchase']) {
        customerExperience.trackCustomerBehavior(event.userId, {
          type: event.eventType,
          data: event.data,
        });
      }

      // Track performance metrics
      if (event.performance?.responseTime) {
        monitoring.trackApiCall(
          event.data?.endpoint || 'unknown',
          event.performance.responseTime,
          !event.data?.error
        );
      }

      // Track errors
      if (event.eventType === 'error') {
        monitoring.trackError(
          event.data?.errorType || 'unknown',
          event.data?.message || 'Unknown error',
          event.data
        );
      }
    } catch (error) {
      console.error('Failed to update monitoring systems:', error);
    }
  }

  // Process individual event
  private async processEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Send to external analytics services
      await Promise.allSettled([
        this.sendToGoogleAnalytics(event),
        this.sendToMixpanel(event),
        this.sendToCustomAnalytics(event),
      ]);

      // Store in database (if configured)
      await this.storeInDatabase(event);

      // Process business rules
      await this.processBusinessRules(event);
    } catch (error) {
      console.error('Event processing failed:', error);
      
      // Add to dead letter queue for retry
      resilience.addToDeadLetterQueue({
        type: 'api_call',
        payload: { event },
        error: (error as Error).message,
      });
    }
  }

  // Process event queue
  private async processEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToProcess = this.eventQueue.splice(0, 100); // Process in batches of 100
    
    await Promise.allSettled(
      eventsToProcess.map(event => this.processEvent(event))
    );
  }

  // Send to Google Analytics 4
  private async sendToGoogleAnalytics(event: AnalyticsEvent): Promise<void> {
    if (!process.env.GA_MEASUREMENT_ID) return;

    const gaEvent = {
      client_id: event.sessionId || 'anonymous',
      events: [{
        name: event.eventType,
        parameters: {
          event_category: event.category,
          event_label: event.data?.label,
          value: event.revenue?.value,
          currency: event.revenue?.currency,
          custom_parameters: event.data,
        },
      }],
    };

    try {
      await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GA_MEASUREMENT_ID}&api_secret=${process.env.GA_API_SECRET}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gaEvent),
      });
    } catch (error) {
      console.error('GA4 tracking failed:', error);
    }
  }

  // Send to Mixpanel
  private async sendToMixpanel(event: AnalyticsEvent): Promise<void> {
    if (!process.env.MIXPANEL_TOKEN) return;

    const mixpanelEvent = {
      event: event.eventType,
      properties: {
        ...event.data,
        ...event.context,
        distinct_id: event.userId || event.sessionId,
        time: event.timestamp,
        $insert_id: `${event.timestamp}_${event.sessionId}`,
      },
    };

    try {
      const data = Buffer.from(JSON.stringify(mixpanelEvent)).toString('base64');
      await fetch(`https://api.mixpanel.com/track/?data=${data}&verbose=1&ip=1`, {
        method: 'GET',
      });
    } catch (error) {
      console.error('Mixpanel tracking failed:', error);
    }
  }

  // Send to custom analytics endpoint
  private async sendToCustomAnalytics(event: AnalyticsEvent): Promise<void> {
    if (!process.env.CUSTOM_ANALYTICS_ENDPOINT) return;

    try {
      await fetch(process.env.CUSTOM_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CUSTOM_ANALYTICS_TOKEN}`,
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Custom analytics tracking failed:', error);
    }
  }

  // Store in database
  private async storeInDatabase(event: AnalyticsEvent): Promise<void> {
    try {
      // Import Supabase service dynamically
      const { SupabaseService } = await import('../../src/lib/supabase-complete');
      
      // For session_start, create a dedicated session record first
      if (event.eventType === 'session_start') {
        const utm = (event.data as any)?.utm || {};
        await SupabaseService.trackSession({
          sessionId: event.sessionId || 'anonymous',
          customerId: event.userId,
          user_agent: event.context.userAgent,
          deviceType: event.context.device as any,
          browser_family: event.context.browser,
          os_family: event.context.os,
          country: (event.context as any).country,
          utmSource: utm.utm_source,
          utmMedium: utm.utm_medium,
          utmCampaign: utm.utm_campaign,
          startedAt: event.timestamp,
        });
      }

      // Store generic event in Supabase
      await SupabaseService.trackEvent({
        session_id: event.sessionId || 'anonymous',
        customer_id: event.userId,
        event_type: event.eventType,
        event_category: event.category,
        event_action: event.data.action || 'unknown',
        event_label: event.data.label,
        event_data: {
          ...event.data,
          context: event.context,
          performance: event.performance,
          metadata: event.metadata,
        },
        event_value: event.revenue?.value || event.data.value,
        page_path: event.context.url,
      });
      
      // Store performance data if available
      if (event.performance?.responseTime) {
        await SupabaseService.trackApiPerformance({
          endpoint: event.context.url || 'unknown',
          method: event.data.method || 'GET',
          response_time: event.performance.responseTime,
          status_code: event.data.statusCode || 200,
          success: event.eventType !== 'error',
          user_agent: event.context.userAgent,
          ip_address: event.context.ipAddress,
          error_type: event.eventType === 'error' ? event.data.errorType : undefined,
          error_message: event.eventType === 'error' ? event.data.message : undefined,
        });
      }
      
      console.log('Event stored in Supabase:', {
        eventType: event.eventType,
        category: event.category,
        timestamp: event.timestamp,
      });
    } catch (error) {
      console.error('Supabase storage error:', error);
    }
  }

  // Process business rules
  private async processBusinessRules(event: AnalyticsEvent): Promise<void> {
    // Implement business rules based on events
    switch (event.eventType) {
      case 'purchase':
        await this.processPurchaseEvent(event);
        break;
      case 'cart_abandonment':
        await this.processCartAbandonmentEvent(event);
        break;
      case 'high_value_customer':
        await this.processHighValueCustomerEvent(event);
        break;
    }
  }

  private async processPurchaseEvent(event: AnalyticsEvent): Promise<void> {
    // Update customer lifetime value
    if (event.userId && event.revenue) {
      try {
        const { SupabaseService } = await import('../../src/lib/supabase-complete');
        
        // Update customer metrics
        await SupabaseService.updateCustomerMetrics(event.userId, {
          totalSpent: event.revenue.value,
          totalOrders: 1,
        });
        
        console.log(`Customer ${event.userId} made purchase: $${event.revenue.value}`);
      } catch (error) {
        console.error('Failed to update customer purchase metrics:', error);
      }
    }
  }

  private async processCartAbandonmentEvent(event: AnalyticsEvent): Promise<void> {
    // Trigger abandoned cart email sequence
    if (event.userId) {
      console.log(`Trigger abandoned cart flow for user: ${event.userId}`);
    }
  }

  private async processHighValueCustomerEvent(event: AnalyticsEvent): Promise<void> {
    // Move customer to VIP segment
    if (event.userId) {
      console.log(`Move customer ${event.userId} to VIP segment`);
    }
  }

  // Utility methods
  private detectDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
    if (/Mobi|Android/i.test(userAgent)) return 'mobile';
    if (/Tablet|iPad/i.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  private detectBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private detectOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('iOS')) return 'iOS';
    if (userAgent.includes('Android')) return 'Android';
    return 'Unknown';
  }

  private async getGeolocation(ipAddress: string): Promise<any> {
    // This would integrate with a geolocation service
    // For now, return mock data
    return {
      country: 'US',
      region: 'CA',
      city: 'San Francisco',
    };
  }

  // Cleanup
  shutdown(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    // Process remaining events
    this.processEventQueue();
  }
}

// ============================================================================
// API HANDLER
// ============================================================================

const analyticsProcessor = new AnalyticsProcessor();

export default async function handler(req: Request): Promise<Response> {
  const startTime = performance.now();
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  // Security headers
  const securityHeaders = security.getSecurityHeaders();

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...securityHeaders }
    });
  }

  try {
    // Rate limiting
    const rateLimitAllowed = await security.checkRateLimit(clientIP, 'api');
    if (!rateLimitAllowed) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded' 
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...securityHeaders }
      });
    }

    // Parse request body
    const body = await req.json();
    
    // Extract event data
    const event: AnalyticsEvent = {
      eventType: body.eventType,
      category: body.category || 'unknown',
      timestamp: body.timestamp || Date.now(),
      sessionId: body.sessionId,
      userId: body.userId,
      data: body.data || {},
      context: {
        ...body.context,
        ipAddress: clientIP,
        userAgent: req.headers.get('user-agent') || undefined,
        referrer: req.headers.get('referer') || undefined,
      },
      performance: body.performance,
      revenue: body.revenue,
      metadata: body.metadata,
    };

    // Track the event
    const result = await analyticsProcessor.trackEvent(event);

    // Track API performance
    const responseTime = performance.now() - startTime;
    monitoring.trackApiCall('/api/analytics/track', responseTime, result.success);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json', ...securityHeaders }
    });

  } catch (error) {
    const responseTime = performance.now() - startTime;
    
    // Track error
    monitoring.trackApiCall('/api/analytics/track', responseTime, false);
    monitoring.trackError('analytics_api_error', 'Analytics tracking API error', {
      error: (error as Error).message,
      clientIP,
    });

    console.error('Analytics API error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      debug: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...securityHeaders }
    });
  }
}

// ============================================================================
// BATCH TRACKING ENDPOINT
// ============================================================================

export async function handleBatch(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json();
    const events: AnalyticsEvent[] = body.events || [];

    if (!Array.isArray(events) || events.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Events array is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (events.length > 100) {
      return new Response(JSON.stringify({ 
        error: 'Maximum 100 events per batch' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Process events in parallel
    const results = await Promise.allSettled(
      events.map(event => analyticsProcessor.trackEvent(event))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.length - successful;

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      successful,
      failed,
      results: results.map(r => 
        r.status === 'fulfilled' ? r.value : { success: false, error: r.reason }
      ),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Batch analytics error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Batch processing failed',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 