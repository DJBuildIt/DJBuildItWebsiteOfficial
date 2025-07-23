// Advanced Monitoring & Analytics System
// Enterprise-grade monitoring, alerting, and business intelligence

import { API_ENDPOINTS } from './ecommerce-config';

// ============================================================================
// MONITORING CONFIGURATION
// ============================================================================

export const MONITORING_CONFIG = {
  // Performance thresholds
  performance: {
    pageLoadTime: 2000, // 2 seconds
    apiResponseTime: 1000, // 1 second
    checkoutFlowTime: 10000, // 10 seconds
    errorRate: 0.01, // 1% error rate threshold
  },
  
  // Business metrics thresholds
  business: {
    conversionRate: 0.15, // 15% target conversion rate
    averageOrderValue: 25, // USD
    cartAbandonmentRate: 0.70, // 70% threshold
    customerRetentionRate: 0.30, // 30% target
  },
  
  // Alert configuration
  alerts: {
    emailThreshold: 5, // Send email after 5 similar incidents
    smsThreshold: 10, // Send SMS after 10 critical incidents
    slackThreshold: 1, // Send Slack notification immediately
  },
} as const;

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  threshold?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export interface BusinessMetric {
  name: string;
  value: number;
  target?: number;
  period: 'hour' | 'day' | 'week' | 'month';
  timestamp: number;
  breakdown?: Record<string, number>;
}

class MonitoringSystem {
  private metrics: PerformanceMetric[] = [];
  private businessMetrics: BusinessMetric[] = [];
  private alerts: Array<{ type: string; message: string; timestamp: number; severity: string }> = [];
  
  // Performance monitoring
  trackPageLoad(pageName: string, loadTime: number) {
    const metric: PerformanceMetric = {
      name: 'page_load_time',
      value: loadTime,
      timestamp: Date.now(),
      threshold: MONITORING_CONFIG.performance.pageLoadTime,
      severity: loadTime > MONITORING_CONFIG.performance.pageLoadTime ? 'high' : 'low',
      metadata: { page: pageName },
    };
    
    this.metrics.push(metric);
    this.checkThresholds(metric);
    this.sendToAnalytics('performance', metric);
  }
  
  trackApiCall(endpoint: string, responseTime: number, success: boolean) {
    const metric: PerformanceMetric = {
      name: 'api_response_time',
      value: responseTime,
      timestamp: Date.now(),
      threshold: MONITORING_CONFIG.performance.apiResponseTime,
      severity: responseTime > MONITORING_CONFIG.performance.apiResponseTime ? 'medium' : 'low',
      metadata: { endpoint, success },
    };
    
    this.metrics.push(metric);
    this.checkThresholds(metric);
    this.sendToAnalytics('api', metric);
  }
  
  trackCheckoutFlow(step: string, duration: number, success: boolean) {
    const metric: PerformanceMetric = {
      name: 'checkout_flow_time',
      value: duration,
      timestamp: Date.now(),
      threshold: MONITORING_CONFIG.performance.checkoutFlowTime,
      severity: !success ? 'critical' : duration > MONITORING_CONFIG.performance.checkoutFlowTime ? 'high' : 'low',
      metadata: { step, success },
    };
    
    this.metrics.push(metric);
    this.checkThresholds(metric);
    this.sendToAnalytics('checkout', metric);
  }
  
  // Business metrics tracking
  trackConversion(type: 'view' | 'add_to_cart' | 'checkout' | 'purchase' | 'order_status_change' | 'customer_acquisition', value?: number) {
    const businessMetric: BusinessMetric = {
      name: 'conversion_funnel',
      value: value || 1,
      target: MONITORING_CONFIG.business.conversionRate,
      period: 'day',
      timestamp: Date.now(),
      breakdown: { [type]: 1 },
    };
    
    this.businessMetrics.push(businessMetric);
    this.sendToAnalytics('business', businessMetric);
  }
  
  trackOrderValue(orderValue: number, productId: string) {
    const businessMetric: BusinessMetric = {
      name: 'average_order_value',
      value: orderValue,
      target: MONITORING_CONFIG.business.averageOrderValue,
      period: 'day',
      timestamp: Date.now(),
      breakdown: { [productId]: orderValue },
    };
    
    this.businessMetrics.push(businessMetric);
    this.sendToAnalytics('business', businessMetric);
  }
  
  trackCartAbandonment(sessionId: string, step: string, value: number) {
    const businessMetric: BusinessMetric = {
      name: 'cart_abandonment',
      value: 1,
      target: MONITORING_CONFIG.business.cartAbandonmentRate,
      period: 'day',
      timestamp: Date.now(),
      breakdown: { [step]: 1, value },
    };
    
    this.businessMetrics.push(businessMetric);
    this.sendToAnalytics('business', businessMetric);
  }
  
  // Error tracking
  trackError(errorType: string, message: string, context?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name: 'error_rate',
      value: 1,
      timestamp: Date.now(),
      threshold: MONITORING_CONFIG.performance.errorRate,
      severity: 'high',
      metadata: { errorType, message, context },
    };
    
    this.metrics.push(metric);
    this.alertError(errorType, message, context);
    this.sendToAnalytics('error', metric);
  }
  
  // Alert system
  private checkThresholds(metric: PerformanceMetric) {
    if (metric.threshold && metric.value > metric.threshold) {
      this.triggerAlert({
        type: 'performance_threshold',
        message: `${metric.name} exceeded threshold: ${metric.value} > ${metric.threshold}`,
        timestamp: Date.now(),
        severity: metric.severity,
      });
    }
  }
  
  private alertError(errorType: string, message: string, context?: Record<string, any>) {
    this.triggerAlert({
      type: 'error',
      message: `${errorType}: ${message}`,
      timestamp: Date.now(),
      severity: 'critical',
    });
  }
  
  private triggerAlert(alert: { type: string; message: string; timestamp: number; severity: string }) {
    this.alerts.push(alert);
    
    // Send to external alerting systems
    this.sendAlert(alert);
    
    // Console log for immediate visibility
    console.warn(`🚨 Alert: ${alert.type} - ${alert.message}`);
  }
  
  private async sendAlert(alert: any) {
    try {
      // Send to multiple channels based on severity
      if (alert.severity === 'critical') {
        await this.sendSlackAlert(alert);
        await this.sendEmailAlert(alert);
      } else if (alert.severity === 'high') {
        await this.sendSlackAlert(alert);
      }
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }
  
  private async sendSlackAlert(alert: any) {
    // Placeholder for Slack webhook integration
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) return;
    
    try {
      const payload = {
        text: `🚨 ${alert.type}: ${alert.message}`,
        attachments: [{
          color: alert.severity === 'critical' ? 'danger' : 'warning',
          fields: [{
            title: 'Severity',
            value: alert.severity,
            short: true
          }, {
            title: 'Timestamp',
            value: new Date(alert.timestamp).toISOString(),
            short: true
          }]
        }]
      };
      
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Slack alert failed:', error);
    }
  }
  
  private async sendEmailAlert(alert: any) {
    // Placeholder for email alert integration
    try {
      // This would integrate with your email service (SendGrid, etc.)
      console.log('Email alert would be sent:', alert);
    } catch (error) {
      console.error('Email alert failed:', error);    }
  }
  
  private sendToAnalytics(category: string, data: any) {
    // Send to Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', data.name, {
        event_category: category,
        event_label: data.metadata?.endpoint || data.metadata?.page || 'unknown',
        value: data.value,
        custom_parameters: data.metadata,
      });
    }
    
    // Send to Vercel Analytics
    if (typeof window !== 'undefined' && (window as any).va) {
      (window as any).va('track', data.name, {
        category,
        ...data.metadata,
        value: data.value,
      });
    }
    
    // Send to custom analytics endpoint
    this.sendToCustomAnalytics(category, data);
    
    // Send to Supabase analytics
    this.sendToSupabaseAnalytics(category, data);
  }
  
  private async sendToCustomAnalytics(category: string, data: any) {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          timestamp: Date.now(),
          data,
        }),
      });
    } catch (error) {
      // Fail silently for analytics
    }
  }

  private async sendToSupabaseAnalytics(category: string, data: any) {
    try {
      // Import dynamically to avoid SSR issues
      const { SupabaseService } = await import('./supabase-complete');
      
      if (category === 'performance') {
        await SupabaseService.trackApiPerformance({
          endpoint: data.metadata?.endpoint || data.name,
          method: 'GET',
          response_time: data.value,
          status_code: data.metadata?.success ? 200 : 500,
          success: data.metadata?.success || false,
          error_type: data.severity === 'critical' ? 'performance_threshold' : undefined,
          error_message: data.severity === 'critical' ? `${data.name} exceeded threshold` : undefined,
        });
      } else if (category === 'business') {
        // Track business events
        await SupabaseService.trackEvent({
          session_id: data.metadata?.sessionId || 'monitoring',
          event_type: 'business_metric',
          event_category: category,
          event_action: data.name,
          event_value: data.value,
          event_data: data.metadata,
        });
      } else if (category === 'error') {
        await SupabaseService.trackApiPerformance({
          endpoint: data.metadata?.endpoint || 'unknown',
          method: 'POST',
          response_time: 0,
          status_code: 500,
          success: false,
          error_type: data.metadata?.errorType || 'unknown_error',
          error_message: data.metadata?.message || 'Unknown error',
        });
      }
    } catch (error) {
      // Fail silently for analytics
      console.debug('Supabase analytics failed:', error);
    }
  }
  
  // Dashboard data
  getDashboardData() {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    // Recent metrics
    const recentMetrics = this.metrics.filter(m => m.timestamp > oneDayAgo);
    const recentBusinessMetrics = this.businessMetrics.filter(m => m.timestamp > oneDayAgo);
    const recentAlerts = this.alerts.filter(a => a.timestamp > oneDayAgo);
    
    return {
      performance: {
        avgPageLoadTime: this.calculateAverage(recentMetrics.filter(m => m.name === 'page_load_time')),
        avgApiResponseTime: this.calculateAverage(recentMetrics.filter(m => m.name === 'api_response_time')),
        errorRate: recentMetrics.filter(m => m.name === 'error_rate').length / Math.max(recentMetrics.length, 1),
      },
      business: {
        totalOrders: recentBusinessMetrics.filter(m => m.name === 'conversion_funnel').length,
                 avgOrderValue: recentBusinessMetrics.filter(m => m.name === 'average_order_value').reduce((sum, m) => sum + m.value, 0) / Math.max(recentBusinessMetrics.filter(m => m.name === 'average_order_value').length, 1),
        conversionRate: this.calculateConversionRate(recentBusinessMetrics),
      },
      alerts: {
        total: recentAlerts.length,
        critical: recentAlerts.filter(a => a.severity === 'critical').length,
        high: recentAlerts.filter(a => a.severity === 'high').length,
      },
    };
  }
  
  private calculateAverage(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
  }
  
  private calculateConversionRate(metrics: BusinessMetric[]): number {
    const funnel = metrics.filter(m => m.name === 'conversion_funnel');
    const views = funnel.filter(m => m.breakdown?.view).length;
    const purchases = funnel.filter(m => m.breakdown?.purchase).length;
    return views > 0 ? purchases / views : 0;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const monitoring = new MonitoringSystem();

// ============================================================================
// PERFORMANCE HOOKS
// ============================================================================

export const usePerformanceTracking = () => {
  const trackPageLoad = (pageName: string) => {
    const startTime = performance.now();
    
    return () => {
      const loadTime = performance.now() - startTime;
      monitoring.trackPageLoad(pageName, loadTime);
    };
  };
  
  const trackApiCall = async <T>(
    endpoint: string, 
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    let success = false;
    
    try {
      const result = await apiCall();
      success = true;
      return result;
    } catch (error) {
      monitoring.trackError('api_error', `API call failed: ${endpoint}`, { endpoint, error });
      throw error;
    } finally {
      const responseTime = performance.now() - startTime;
      monitoring.trackApiCall(endpoint, responseTime, success);
    }
  };
  
  const trackCheckoutStep = (step: string) => {
    const startTime = performance.now();
    
    return (success: boolean) => {
      const duration = performance.now() - startTime;
      monitoring.trackCheckoutFlow(step, duration, success);
    };
  };
  
  return {
    trackPageLoad,
    trackApiCall,
    trackCheckoutStep,
    trackConversion: monitoring.trackConversion.bind(monitoring),
    trackOrderValue: monitoring.trackOrderValue.bind(monitoring),
    trackError: monitoring.trackError.bind(monitoring),
  };
};

// ============================================================================
// BUSINESS INTELLIGENCE
// ============================================================================

class BusinessIntelligenceService {
  // Revenue analytics
  getRevenueAnalytics(period: 'day' | 'week' | 'month' = 'day') {
    const now = Date.now();
    const periodMs = period === 'day' ? 24 * 60 * 60 * 1000 : 
                   period === 'week' ? 7 * 24 * 60 * 60 * 1000 : 
                   30 * 24 * 60 * 60 * 1000;
    
    const recentOrders = monitoring['businessMetrics'].filter(
      m => m.name === 'average_order_value' && m.timestamp > now - periodMs
    );
    
    return {
      totalRevenue: recentOrders.reduce((sum, order) => sum + order.value, 0),
      orderCount: recentOrders.length,
      averageOrderValue: recentOrders.length > 0 ? 
        recentOrders.reduce((sum, order) => sum + order.value, 0) / recentOrders.length : 0,
      topProducts: this.getTopProducts(recentOrders),
    };
  }
  
  // Customer analytics
  getCustomerAnalytics() {
    const funnel = monitoring['businessMetrics'].filter(m => m.name === 'conversion_funnel');
    
    return {
      totalViews: funnel.filter(m => m.breakdown?.view).length,
      totalCarts: funnel.filter(m => m.breakdown?.add_to_cart).length,
      totalCheckouts: funnel.filter(m => m.breakdown?.checkout).length,
      totalPurchases: funnel.filter(m => m.breakdown?.purchase).length,
      conversionRate: this.calculateFunnelConversion(funnel),
    };
  }
  
  // Performance insights
  getPerformanceInsights() {
    const errors = monitoring['metrics'].filter(m => m.name === 'error_rate');
    const pageLoads = monitoring['metrics'].filter(m => m.name === 'page_load_time');
    
    return {
      errorRate: errors.length / Math.max(monitoring['metrics'].length, 1),
      avgPageLoadTime: pageLoads.reduce((sum, m) => sum + m.value, 0) / Math.max(pageLoads.length, 1),
      slowestPages: this.getSlowestPages(pageLoads),
      mostCommonErrors: this.getMostCommonErrors(errors),
    };
  }
  
  private getTopProducts(orders: BusinessMetric[]) {
    const productCounts: Record<string, { count: number; revenue: number }> = {};
    
    orders.forEach(order => {
      if (order.breakdown) {
        Object.entries(order.breakdown).forEach(([productId, revenue]) => {
          productCounts[productId] = productCounts[productId] || { count: 0, revenue: 0 };
          productCounts[productId].count++;
          productCounts[productId].revenue += revenue;
        });
      }
    });
    
    return Object.entries(productCounts)
      .sort(([,a], [,b]) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(([productId, data]) => ({ productId, ...data }));
  }
  
  private calculateFunnelConversion(funnel: BusinessMetric[]) {
    const views = funnel.filter(m => m.breakdown?.view).length;
    const purchases = funnel.filter(m => m.breakdown?.purchase).length;
    return views > 0 ? (purchases / views) * 100 : 0;
  }
  
  private getSlowestPages(pageLoads: PerformanceMetric[]) {
    const pagePerformance: Record<string, number[]> = {};
    
    pageLoads.forEach(metric => {
      const page = metric.metadata?.page || 'unknown';
      pagePerformance[page] = pagePerformance[page] || [];
      pagePerformance[page].push(metric.value);
    });
    
    return Object.entries(pagePerformance)
      .map(([page, times]) => ({
        page,
        avgTime: times.reduce((sum, time) => sum + time, 0) / times.length,
        count: times.length,
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);
  }
  
  private getMostCommonErrors(errors: PerformanceMetric[]) {
    const errorCounts: Record<string, number> = {};
    
    errors.forEach(error => {
      const errorType = error.metadata?.errorType || 'unknown';
      errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
    });
    
    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([errorType, count]) => ({ errorType, count }));
  }
}

export const BusinessIntelligence = new BusinessIntelligenceService();

export default monitoring; 