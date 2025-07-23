// Advanced Customer Experience & Order Tracking System
// Enterprise-grade customer management, order tracking, and personalization

import { monitoring } from './monitoring';
import { security } from './security';

// ============================================================================
// CUSTOMER EXPERIENCE CONFIGURATION
// ============================================================================

export const CUSTOMER_CONFIG = {
  // Order tracking settings
  tracking: {
    statusUpdateIntervalMs: 30000, // 30 seconds
    maxTrackingHistoryDays: 90,
    enableRealTimeUpdates: true,
    enableSMSNotifications: true,
    enableEmailNotifications: true,
  },
  
  // Personalization settings
  personalization: {
    enableRecommendations: true,
    maxRecommendations: 6,
    trackingCookieExpireDays: 30,
    enableBehaviorTracking: true,
    enableRetargeting: true,
  },
  
  // Customer insights
  insights: {
    segmentationEnabled: true,
    lifetimeValueTracking: true,
    churnPrediction: true,
    engagementScoring: true,
  },
  
  // Communication preferences
  communication: {
    defaultEmailFrequency: 'weekly',
    allowUnsubscribe: true,
    respectDoNotTrack: true,
    gdprCompliant: true,
  },
} as const;

// ============================================================================
// ORDER TRACKING TYPES
// ============================================================================

export interface OrderStatus {
  status: 'pending' | 'processing' | 'fulfillment' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  timestamp: number;
  description: string;
  location?: string;
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: number;
  metadata?: Record<string, any>;
}

export interface OrderTracking {
  orderId: string;
  customerId?: string;
  email: string;
  currentStatus: OrderStatus['status'];
  statusHistory: OrderStatus[];
  trackingNumber?: string;
  carrier?: string;
  shippingAddress: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    imageUrl?: string;
  }>;
  totalAmount: number;
  currency: string;
  createdAt: number;
  updatedAt: number;
  notifications: {
    email: boolean;
    sms: boolean;
    lastEmailSent?: number;
    lastSMSSent?: number;
  };
}

// ============================================================================
// CUSTOMER PROFILE TYPES
// ============================================================================

export interface CustomerProfile {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  dateOfBirth?: string;
  preferences: {
    emailFrequency: 'never' | 'weekly' | 'monthly';
    smsNotifications: boolean;
    productCategories: string[];
    language: string;
    currency: string;
  };
  addresses: Array<{
    id: string;
    type: 'shipping' | 'billing';
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }>;
  orderHistory: string[]; // order IDs
  metrics: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lifetimeValue: number;
    lastOrderDate?: number;
    acquisitionDate: number;
    churnRisk: 'low' | 'medium' | 'high';
    engagementScore: number; // 0-100
    segmentId?: string;
  };
  behavior: {
    pageViews: number;
    sessionCount: number;
    averageSessionDuration: number;
    lastVisit: number;
    favoriteProducts: string[];
    abandonedCarts: Array<{
      sessionId: string;
      items: any[];
      timestamp: number;
      value: number;
    }>;
  };
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// ORDER TRACKING SYSTEM
// ============================================================================

class OrderTracker {
  private orders = new Map<string, OrderTracking>();
  private trackingInterval?: NodeJS.Timeout;

  constructor() {
    if (CUSTOMER_CONFIG.tracking.enableRealTimeUpdates) {
      this.startRealTimeTracking();
    }
  }

  // Create new order tracking
  createOrderTracking(order: Omit<OrderTracking, 'statusHistory' | 'currentStatus' | 'createdAt' | 'updatedAt'>): OrderTracking {
    const now = Date.now();
    const initialStatus: OrderStatus = {
      status: 'pending',
      timestamp: now,
      description: 'Order received and being processed',
      metadata: { source: 'stripe_checkout' },
    };

    const orderTracking: OrderTracking = {
      ...order,
      currentStatus: 'pending',
      statusHistory: [initialStatus],
      createdAt: now,
      updatedAt: now,
    };

    this.orders.set(order.orderId, orderTracking);

    // Track order creation
    monitoring.trackConversion('purchase', order.totalAmount);
    monitoring.trackOrderValue(order.totalAmount, order.items[0]?.productId || 'unknown');

    // Send confirmation email
    this.sendOrderConfirmation(orderTracking);

    return orderTracking;
  }

  // Update order status
  async updateOrderStatus(
    orderId: string, 
    status: OrderStatus['status'], 
    description: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    const order = this.orders.get(orderId);
    if (!order) {
      monitoring.trackError('order_not_found', `Order not found for status update: ${orderId}`);
      return false;
    }

    const statusUpdate: OrderStatus = {
      status,
      timestamp: Date.now(),
      description,
      metadata,
    };

    // Add tracking info if provided
    if (metadata?.trackingNumber) {
      statusUpdate.trackingNumber = metadata.trackingNumber;
      order.trackingNumber = metadata.trackingNumber;
    }
    if (metadata?.carrier) {
      statusUpdate.carrier = metadata.carrier;
      order.carrier = metadata.carrier;
    }
    if (metadata?.estimatedDelivery) {
      statusUpdate.estimatedDelivery = metadata.estimatedDelivery;
    }

    order.statusHistory.push(statusUpdate);
    order.currentStatus = status;
    order.updatedAt = Date.now();

    // Send notifications based on status
    await this.sendStatusNotification(order, statusUpdate);

    // Track status change
    monitoring.trackConversion('order_status_change', 1);

    return true;
  }

  // Get order by ID or tracking number
  getOrder(identifier: string): OrderTracking | undefined {
    // Try by order ID first
    if (this.orders.has(identifier)) {
      return this.orders.get(identifier);
    }

    // Try by tracking number
    for (const order of this.orders.values()) {
      if (order.trackingNumber === identifier) {
        return order;
      }
    }

    return undefined;
  }

  // Get orders by customer email
  getOrdersByEmail(email: string): OrderTracking[] {
    return Array.from(this.orders.values()).filter(order => 
      order.email.toLowerCase() === email.toLowerCase()
    );
  }

  // Send order confirmation
  private async sendOrderConfirmation(order: OrderTracking): Promise<void> {
    try {
      if (order.notifications.email) {
        await this.sendEmail(order.email, 'order_confirmation', {
          orderId: order.orderId,
          items: order.items,
          totalAmount: order.totalAmount,
          currency: order.currency,
          shippingAddress: order.shippingAddress,
        });
        
        order.notifications.lastEmailSent = Date.now();
      }

      if (order.notifications.sms && order.shippingAddress.name) {
        // SMS confirmation would be sent here
        console.log(`SMS confirmation for order ${order.orderId}`);
      }
    } catch (error) {
      monitoring.trackError('notification_failed', `Failed to send order confirmation for ${order.orderId}`, {
        error: (error as Error).message,
      });
    }
  }

  // Send status notification
  private async sendStatusNotification(order: OrderTracking, status: OrderStatus): Promise<void> {
    try {
      // Only send notifications for significant status changes
      const notifiableStatuses: OrderStatus['status'][] = ['processing', 'shipped', 'delivered'];
      
      if (!notifiableStatuses.includes(status.status)) {
        return;
      }

      if (order.notifications.email) {
        await this.sendEmail(order.email, 'order_status_update', {
          orderId: order.orderId,
          status: status.status,
          description: status.description,
          trackingNumber: status.trackingNumber,
          carrier: status.carrier,
          estimatedDelivery: status.estimatedDelivery,
        });
        
        order.notifications.lastEmailSent = Date.now();
      }

      if (order.notifications.sms && status.status === 'shipped') {
        // SMS for shipping notification
        console.log(`SMS shipping notification for order ${order.orderId}`);
      }
    } catch (error) {
      monitoring.trackError('notification_failed', `Failed to send status notification for ${order.orderId}`, {
        error: (error as Error).message,
        status: status.status,
      });
    }
  }

  // Real-time tracking updates (integrates with Printful webhooks)
  private startRealTimeTracking(): void {
    this.trackingInterval = setInterval(async () => {
      await this.syncTrackingUpdates();
    }, CUSTOMER_CONFIG.tracking.statusUpdateIntervalMs);
  }

  private async syncTrackingUpdates(): Promise<void> {
    try {
      // Get orders that need tracking updates
      const activeOrders = Array.from(this.orders.values()).filter(order => 
        ['processing', 'fulfillment', 'shipped'].includes(order.currentStatus)
      );

      for (const order of activeOrders) {
        if (order.trackingNumber && order.carrier) {
          // In a real implementation, this would call the carrier's API
          // For now, we'll simulate updates
          await this.simulateTrackingUpdate(order);
        }
      }
    } catch (error) {
      monitoring.trackError('tracking_sync_failed', 'Failed to sync tracking updates', {
        error: (error as Error).message,
      });
    }
  }

  private async simulateTrackingUpdate(order: OrderTracking): Promise<void> {
    // Simulate tracking updates based on order age
    const orderAge = Date.now() - order.createdAt;
    const dayInMs = 24 * 60 * 60 * 1000;

    if (order.currentStatus === 'processing' && orderAge > 2 * dayInMs) {
      await this.updateOrderStatus(order.orderId, 'fulfillment', 'Order is being prepared for shipment');
    } else if (order.currentStatus === 'fulfillment' && orderAge > 3 * dayInMs) {
      await this.updateOrderStatus(order.orderId, 'shipped', 'Order has been shipped', {
        trackingNumber: order.trackingNumber,
        carrier: order.carrier,
        estimatedDelivery: Date.now() + 5 * dayInMs,
      });
    } else if (order.currentStatus === 'shipped' && orderAge > 8 * dayInMs) {
      await this.updateOrderStatus(order.orderId, 'delivered', 'Order has been delivered');
    }
  }

  // Email sending (placeholder - would integrate with email service)
  private async sendEmail(to: string, template: string, data: any): Promise<void> {
    console.log(`Sending ${template} email to ${to}:`, data);
    // In production, this would integrate with your email service (SendGrid, etc.)
  }

  // Get tracking statistics
  getStats() {
    const orders = Array.from(this.orders.values());
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    const recentOrders = orders.filter(o => now - o.createdAt < 30 * dayInMs);

    return {
      totalOrders: orders.length,
      recentOrders: recentOrders.length,
      statusBreakdown: this.getStatusBreakdown(orders),
      averageProcessingTime: this.calculateAverageProcessingTime(orders),
      onTimeDeliveryRate: this.calculateOnTimeDeliveryRate(orders),
    };
  }

  private getStatusBreakdown(orders: OrderTracking[]) {
    const breakdown: Record<string, number> = {};
    orders.forEach(order => {
      breakdown[order.currentStatus] = (breakdown[order.currentStatus] || 0) + 1;
    });
    return breakdown;
  }

  private calculateAverageProcessingTime(orders: OrderTracking[]): number {
    const processedOrders = orders.filter(o => o.currentStatus !== 'pending');
    if (processedOrders.length === 0) return 0;

    const totalTime = processedOrders.reduce((sum, order) => {
      const shippedStatus = order.statusHistory.find(s => s.status === 'shipped');
      return sum + (shippedStatus ? shippedStatus.timestamp - order.createdAt : 0);
    }, 0);

    return totalTime / processedOrders.length;
  }

  private calculateOnTimeDeliveryRate(orders: OrderTracking[]): number {
    const deliveredOrders = orders.filter(o => o.currentStatus === 'delivered');
    if (deliveredOrders.length === 0) return 0;

    const onTimeDeliveries = deliveredOrders.filter(order => {
      const shippedStatus = order.statusHistory.find(s => s.status === 'shipped');
      const deliveredStatus = order.statusHistory.find(s => s.status === 'delivered');
      
      if (!shippedStatus || !deliveredStatus || !shippedStatus.estimatedDelivery) {
        return false;
      }

      return deliveredStatus.timestamp <= shippedStatus.estimatedDelivery;
    });

    return onTimeDeliveries.length / deliveredOrders.length;
  }

  // Cleanup
  shutdown(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }
  }
}

// ============================================================================
// CUSTOMER MANAGEMENT SYSTEM
// ============================================================================

class CustomerManager {
  private customers = new Map<string, CustomerProfile>();
  private segments = new Map<string, string[]>(); // segmentId -> customerIds

  // Create or update customer profile
  upsertCustomer(email: string, data: Partial<CustomerProfile>): CustomerProfile {
    const existingCustomer = this.getCustomerByEmail(email);
    const now = Date.now();

    if (existingCustomer) {
      // Update existing customer
      const updatedCustomer: CustomerProfile = {
        ...existingCustomer,
        ...data,
        email,
        updatedAt: now,
        metrics: {
          ...existingCustomer.metrics,
          ...data.metrics,
        },
        behavior: {
          ...existingCustomer.behavior,
          ...data.behavior,
        },
      };
      
      this.customers.set(existingCustomer.id, updatedCustomer);
      return updatedCustomer;
    } else {
      // Create new customer
      const newCustomer: CustomerProfile = {
        id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        preferences: {
          emailFrequency: 'weekly',
          smsNotifications: false,
          productCategories: [],
          language: 'en',
          currency: 'USD',
        },
        addresses: [],
        orderHistory: [],
        metrics: {
          totalOrders: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          lifetimeValue: 0,
          acquisitionDate: now,
          churnRisk: 'low',
          engagementScore: 50,
        },
        behavior: {
          pageViews: 0,
          sessionCount: 0,
          averageSessionDuration: 0,
          lastVisit: now,
          favoriteProducts: [],
          abandonedCarts: [],
        },
        createdAt: now,
        updatedAt: now,
        ...data,
      };

      this.customers.set(newCustomer.id, newCustomer);
      
      // Track new customer acquisition
      monitoring.trackConversion('customer_acquisition', 1);
      
      return newCustomer;
    }
  }

  // Get customer by email
  getCustomerByEmail(email: string): CustomerProfile | undefined {
    for (const customer of this.customers.values()) {
      if (customer.email.toLowerCase() === email.toLowerCase()) {
        return customer;
      }
    }
    return undefined;
  }

  // Get customer by ID
  getCustomer(customerId: string): CustomerProfile | undefined {
    return this.customers.get(customerId);
  }

  // Track customer behavior
  trackBehavior(email: string, event: {
    type: 'page_view' | 'session_start' | 'add_to_cart' | 'checkout_start' | 'purchase';
    data?: any;
  }): void {
    const customer = this.getCustomerByEmail(email);
    if (!customer) return;

    const now = Date.now();

    switch (event.type) {
      case 'page_view':
        customer.behavior.pageViews++;
        customer.behavior.lastVisit = now;
        break;
      
      case 'session_start':
        customer.behavior.sessionCount++;
        customer.behavior.lastVisit = now;
        break;
      
      case 'add_to_cart':
        // Track product interest
        if (event.data?.productId && !customer.behavior.favoriteProducts.includes(event.data.productId)) {
          customer.behavior.favoriteProducts.push(event.data.productId);
        }
        break;
      
      case 'checkout_start':
        // Remove from abandoned carts if checkout is started
        customer.behavior.abandonedCarts = customer.behavior.abandonedCarts.filter(
          cart => cart.sessionId !== event.data?.sessionId
        );
        break;

      case 'purchase':
        // Update purchase metrics
        if (event.data?.orderId && !customer.orderHistory.includes(event.data.orderId)) {
          customer.orderHistory.push(event.data.orderId);
          customer.metrics.totalOrders++;
          customer.metrics.totalSpent += event.data.amount || 0;
          customer.metrics.averageOrderValue = customer.metrics.totalSpent / customer.metrics.totalOrders;
          customer.metrics.lifetimeValue = this.calculateLifetimeValue(customer);
          customer.metrics.lastOrderDate = now;
          customer.metrics.churnRisk = this.calculateChurnRisk(customer);
        }
        break;
    }

    // Update engagement score
    customer.metrics.engagementScore = this.calculateEngagementScore(customer);
    customer.updatedAt = now;

    // Update customer segmentation
    this.updateCustomerSegmentation(customer);

    this.customers.set(customer.id, customer);
  }

  // Track abandoned cart
  trackAbandonedCart(email: string, cart: {
    sessionId: string;
    items: any[];
    value: number;
  }): void {
    const customer = this.getCustomerByEmail(email);
    if (!customer) return;

    // Remove existing abandoned cart for this session
    customer.behavior.abandonedCarts = customer.behavior.abandonedCarts.filter(
      c => c.sessionId !== cart.sessionId
    );

    // Add new abandoned cart
    customer.behavior.abandonedCarts.push({
      ...cart,
      timestamp: Date.now(),
    });

    // Keep only recent abandoned carts (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    customer.behavior.abandonedCarts = customer.behavior.abandonedCarts.filter(
      c => c.timestamp > thirtyDaysAgo
    );

    customer.updatedAt = Date.now();
    this.customers.set(customer.id, customer);

    // Track abandoned cart for analytics
    monitoring.trackCartAbandonment(cart.sessionId, 'abandoned', cart.value);
  }

  // Calculate lifetime value
  private calculateLifetimeValue(customer: CustomerProfile): number {
    const monthsSinceAcquisition = (Date.now() - customer.metrics.acquisitionDate) / (30 * 24 * 60 * 60 * 1000);
    const monthlyValue = customer.metrics.totalSpent / Math.max(monthsSinceAcquisition, 1);
    
    // Project lifetime value based on engagement and purchase frequency
    const engagementMultiplier = customer.metrics.engagementScore / 100;
    const frequencyMultiplier = customer.metrics.totalOrders > 0 ? 1 + (customer.metrics.totalOrders * 0.1) : 1;
    
    return monthlyValue * 24 * engagementMultiplier * frequencyMultiplier; // 24 month projection
  }

  // Calculate churn risk
  private calculateChurnRisk(customer: CustomerProfile): 'low' | 'medium' | 'high' {
    const now = Date.now();
    const daysSinceLastOrder = customer.metrics.lastOrderDate ? 
      (now - customer.metrics.lastOrderDate) / (24 * 60 * 60 * 1000) : Infinity;
    const daysSinceLastVisit = (now - customer.behavior.lastVisit) / (24 * 60 * 60 * 1000);

    if (daysSinceLastOrder > 180 || daysSinceLastVisit > 90 || customer.metrics.engagementScore < 30) {
      return 'high';
    } else if (daysSinceLastOrder > 90 || daysSinceLastVisit > 45 || customer.metrics.engagementScore < 60) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  // Calculate engagement score
  private calculateEngagementScore(customer: CustomerProfile): number {
    let score = 0;
    const now = Date.now();
    const daysSinceAcquisition = (now - customer.metrics.acquisitionDate) / (24 * 60 * 60 * 1000);

    // Recency (last visit) - 30 points
    const daysSinceLastVisit = (now - customer.behavior.lastVisit) / (24 * 60 * 60 * 1000);
    if (daysSinceLastVisit < 7) score += 30;
    else if (daysSinceLastVisit < 30) score += 20;
    else if (daysSinceLastVisit < 90) score += 10;

    // Frequency (visits per month) - 25 points
    const visitsPerMonth = customer.behavior.sessionCount / Math.max(daysSinceAcquisition / 30, 1);
    if (visitsPerMonth > 4) score += 25;
    else if (visitsPerMonth > 2) score += 20;
    else if (visitsPerMonth > 1) score += 15;
    else if (visitsPerMonth > 0.5) score += 10;

    // Monetary (purchases) - 25 points
    if (customer.metrics.totalOrders > 5) score += 25;
    else if (customer.metrics.totalOrders > 2) score += 20;
    else if (customer.metrics.totalOrders > 0) score += 15;

    // Engagement actions - 20 points
    if (customer.behavior.favoriteProducts.length > 3) score += 10;
    if (customer.behavior.pageViews > 20) score += 10;

    return Math.min(score, 100);
  }

  // Update customer segmentation
  private updateCustomerSegmentation(customer: CustomerProfile): void {
    // Remove customer from existing segments
    for (const [segmentId, customerIds] of this.segments.entries()) {
      const index = customerIds.indexOf(customer.id);
      if (index > -1) {
        customerIds.splice(index, 1);
      }
    }

    // Determine new segment
    let segmentId: string;
    
    if (customer.metrics.lifetimeValue > 500 && customer.metrics.totalOrders > 3) {
      segmentId = 'vip_customers';
    } else if (customer.metrics.churnRisk === 'high' && customer.metrics.totalOrders > 0) {
      segmentId = 'at_risk_customers';
    } else if (customer.metrics.totalOrders === 0 && customer.behavior.abandonedCarts.length > 0) {
      segmentId = 'cart_abandoners';
    } else if (customer.metrics.totalOrders > 1) {
      segmentId = 'repeat_customers';
    } else if (customer.metrics.totalOrders === 1) {
      segmentId = 'new_customers';
    } else {
      segmentId = 'prospects';
    }

    // Add to new segment
    if (!this.segments.has(segmentId)) {
      this.segments.set(segmentId, []);
    }
    this.segments.get(segmentId)!.push(customer.id);
    customer.metrics.segmentId = segmentId;
  }

  // Get customer recommendations
  getRecommendations(customerId: string): string[] {
    const customer = this.customers.get(customerId);
    if (!customer) return [];

    // Simple recommendation based on favorite products and behavior
    const recommendations: string[] = [];
    
    // Recommend based on favorite products
    recommendations.push(...customer.behavior.favoriteProducts.slice(0, 3));
    
    // Add popular products for customer segment
    const segmentCustomers = customer.metrics.segmentId ? 
      this.segments.get(customer.metrics.segmentId) || [] : [];
    
    // This would be enhanced with actual product analytics
    // For now, return basic recommendations
    return recommendations.slice(0, CUSTOMER_CONFIG.personalization.maxRecommendations);
  }

  // Get customer segment
  getCustomerSegment(segmentId: string): CustomerProfile[] {
    const customerIds = this.segments.get(segmentId) || [];
    return customerIds.map(id => this.customers.get(id)).filter(Boolean) as CustomerProfile[];
  }

  // Get customer analytics
  getAnalytics() {
    const customers = Array.from(this.customers.values());
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    
    const recentCustomers = customers.filter(c => c.createdAt > thirtyDaysAgo);
    const activeCustomers = customers.filter(c => c.behavior.lastVisit > thirtyDaysAgo);
    
    return {
      totalCustomers: customers.length,
      newCustomers: recentCustomers.length,
      activeCustomers: activeCustomers.length,
      averageLifetimeValue: customers.reduce((sum, c) => sum + c.metrics.lifetimeValue, 0) / customers.length,
      churnRisk: {
        high: customers.filter(c => c.metrics.churnRisk === 'high').length,
        medium: customers.filter(c => c.metrics.churnRisk === 'medium').length,
        low: customers.filter(c => c.metrics.churnRisk === 'low').length,
      },
      segments: Object.fromEntries(
        Array.from(this.segments.entries()).map(([id, customerIds]) => [id, customerIds.length])
      ),
    };
  }
}

// ============================================================================
// CUSTOMER EXPERIENCE MANAGER
// ============================================================================

class CustomerExperienceManager {
  private orderTracker = new OrderTracker();
  private customerManager = new CustomerManager();

  // Order tracking methods
  createOrder(order: Omit<OrderTracking, 'statusHistory' | 'currentStatus' | 'createdAt' | 'updatedAt'>): OrderTracking {
    const tracking = this.orderTracker.createOrderTracking(order);
    
    // Update customer profile
    this.customerManager.trackBehavior(order.email, {
      type: 'purchase',
      data: {
        orderId: order.orderId,
        amount: order.totalAmount,
      },
    });

    return tracking;
  }

  updateOrderStatus(orderId: string, status: OrderStatus['status'], description: string, metadata?: Record<string, any>): Promise<boolean> {
    return this.orderTracker.updateOrderStatus(orderId, status, description, metadata);
  }

  getOrderTracking(identifier: string): OrderTracking | undefined {
    return this.orderTracker.getOrder(identifier);
  }

  getCustomerOrders(email: string): OrderTracking[] {
    return this.orderTracker.getOrdersByEmail(email);
  }

  // Customer management methods
  getCustomer(email: string): CustomerProfile | undefined {
    return this.customerManager.getCustomerByEmail(email);
  }

  updateCustomer(email: string, data: Partial<CustomerProfile>): CustomerProfile {
    return this.customerManager.upsertCustomer(email, data);
  }

  trackCustomerBehavior(email: string, event: { type: string; data?: any }): void {
    this.customerManager.trackBehavior(email, event as any);
  }

  trackAbandonedCart(email: string, cart: { sessionId: string; items: any[]; value: number }): void {
    this.customerManager.trackAbandonedCart(email, cart);
  }

  getCustomerRecommendations(email: string): string[] {
    const customer = this.customerManager.getCustomerByEmail(email);
    return customer ? this.customerManager.getRecommendations(customer.id) : [];
  }

  // Analytics and insights
  getCustomerInsights() {
    return {
      orders: this.orderTracker.getStats(),
      customers: this.customerManager.getAnalytics(),
      timestamp: Date.now(),
    };
  }

  // Cleanup
  shutdown(): void {
    this.orderTracker.shutdown();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const customerExperience = new CustomerExperienceManager();

// ============================================================================
// CUSTOMER EXPERIENCE HOOKS
// ============================================================================

export const useCustomerExperience = () => {
  const trackPageView = (email?: string, page?: string) => {
    if (email) {
      customerExperience.trackCustomerBehavior(email, {
        type: 'page_view',
        data: { page },
      });
    }
  };

  const trackAddToCart = (email: string, productId: string, quantity: number, sessionId: string) => {
    customerExperience.trackCustomerBehavior(email, {
      type: 'add_to_cart',
      data: { productId, quantity, sessionId },
    });
  };

  const trackCheckoutStart = (email: string, sessionId: string, items: any[], value: number) => {
    customerExperience.trackCustomerBehavior(email, {
      type: 'checkout_start',
      data: { sessionId, items, value },
    });
  };

  const trackAbandonedCart = (email: string, sessionId: string, items: any[], value: number) => {
    customerExperience.trackAbandonedCart(email, {
      sessionId,
      items,
      value,
    });
  };

  const getOrderStatus = (identifier: string) => {
    return customerExperience.getOrderTracking(identifier);
  };

  const getCustomerProfile = (email: string) => {
    return customerExperience.getCustomer(email);
  };

  return {
    trackPageView,
    trackAddToCart,
    trackCheckoutStart,
    trackAbandonedCart,
    getOrderStatus,
    getCustomerProfile,
    getCustomerRecommendations: customerExperience.getCustomerRecommendations.bind(customerExperience),
    getCustomerOrders: customerExperience.getCustomerOrders.bind(customerExperience),
  };
};

export default customerExperience; 