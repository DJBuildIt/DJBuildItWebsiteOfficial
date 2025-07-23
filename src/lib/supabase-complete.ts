import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase-complete';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = (typeof process !== 'undefined' && process.env ? process.env.SUPABASE_SERVICE_ROLE_KEY : undefined) || import.meta.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client for anonymous operations (frontend)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'djbuildit-website',
    },
  },
});

// Conditionally create the admin client only when a Service Key is available.
// This avoids throwing an error in the browser where the key should never be exposed.
export const supabaseAdmin = supabaseServiceKey
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'djbuildit-admin',
    },
  },
    })
  : supabase;

// ============================================================================
// TYPES (Replacing Redis KV-Store Types)
// ============================================================================

export interface StripeCustomerData {
  stripeCustomerId: string;
  status: 'active' | 'inactive' | 'deleted';
  email: string;
  name?: string;
  metadata?: Record<string, string>;
  orders: Array<{
    orderId: string;
    sessionId: string;
    status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'canceled' | 'refunded';
    amount: number;
    currency: string;
    createdAt: number;
  }>;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: number;
  createdAt: number;
  updatedAt: number;
}

export interface OrderSyncData {
  orderId: string;
  stripeSessionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  lastAttempt: number;
  orderData: any;
  error?: string;
}

export interface SessionData {
  sessionId: string;
  customerId?: string;
  ip_address?: string;
  user_agent?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  browser_family?: string;  // Changed from browser
  os_family?: string;
  country?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  startedAt: number;
}

// ============================================================================
// COMPREHENSIVE SUPABASE SERVICE (Replaces Redis KV-Store)
// ============================================================================

export class SupabaseService {
  
  // ============================================================================
  // CUSTOMER MANAGEMENT (Replaces Redis Customer Data)
  // ============================================================================

  /**
   * Create or update customer (replaces Redis customer operations)
   */
  static async createOrUpdateCustomer(data: {
    email?: string;
    name?: string;
    phone?: string;
    session_id: string;
    ip_address?: string;
    user_agent?: string;
    acquisition_source?: string;
    acquisition_campaign?: string;
    acquisition_medium?: string;
    privacy_consent?: boolean;
    marketing_consent?: boolean;
  }) {
    const client = data.email ? supabaseAdmin : supabase;
    
    if (data.email) {
      // Try to find existing customer
      const { data: existingCustomer } = await client
        .from('customers')
        .select('id, session_count')
        .eq('email', data.email)
        .single();

      if (existingCustomer) {
        // Update existing customer
        const { data: updatedCustomer, error } = await client
          .from('customers')
          .update({
            name: data.name,
            phone: data.phone,
            last_visit_at: new Date().toISOString(),
            customer_type: 'lead',
            session_count: (existingCustomer.session_count || 0) + 1,
            email_consent: data.privacy_consent || false,
            marketing_consent: data.marketing_consent || false,
            consent_date: data.privacy_consent ? new Date().toISOString() : undefined,
          })
          .eq('id', existingCustomer.id)
          .select()
          .single();

        if (error) throw error;
        return updatedCustomer.id;
      }
    }

    // Create new customer
    const { data: newCustomer, error } = await client
      .from('customers')
      .insert({
        email: data.email,
        name: data.name,
        phone: data.phone,
        customer_type: data.email ? 'lead' : 'anonymous',
        acquisition_source: data.acquisition_source,
        acquisition_campaign: data.acquisition_campaign,
        acquisition_medium: data.acquisition_medium,
        first_visit_at: new Date().toISOString(),
        last_visit_at: new Date().toISOString(),
        session_count: 1,
        email_consent: data.privacy_consent || false,
        marketing_consent: data.marketing_consent || false,
        analytics_consent: true, // Default to true for anonymous analytics
        data_retention_consent: true,
        consent_date: data.privacy_consent ? new Date().toISOString() : undefined,
      })
      .select()
      .single();

    if (error) throw error;
    return newCustomer.id;
  }

  /**
   * Get customer by email
   */
  static async getCustomerByEmail(email: string) {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Update customer metrics (replaces Redis customer data updates)
   */
  static async updateCustomerMetrics(customerId: string, metrics: {
    totalOrders?: number;
    totalSpent?: number;
    averageOrderValue?: number;
    lifetimeValue?: number;
  }) {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .update(metrics)
      .eq('id', customerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ============================================================================
  // STRIPE INTEGRATION (Replaces Redis KV Stripe Operations)
  // ============================================================================

  /**
   * Store Stripe customer mapping (replaces Redis stripe:user:* keys)
   */
  static async setStripeCustomerMapping(customerId: string, stripeCustomerId: string) {
    const { data, error } = await supabaseAdmin
      .from('stripe_customers')
      .upsert({
        customer_id: customerId,
        stripe_customer_id: stripeCustomerId,
        stripe_status: 'active',
        last_synced_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get Stripe customer mapping (replaces Redis stripe:user:* lookups)
   */
  static async getStripeCustomerMapping(customerId: string) {
    const { data, error } = await supabaseAdmin
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('customer_id', customerId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.stripe_customer_id;
  }

  /**
   * Store comprehensive Stripe customer data (replaces Redis customer data cache)
   */
  static async setStripeCustomerData(stripeCustomerId: string, data: StripeCustomerData) {
    const { data: result, error } = await supabaseAdmin
      .from('stripe_customers')
      .update({
        stripe_data: data,
        stripe_status: data.status,
        last_synced_at: new Date().toISOString(),
        // sync_version will be incremented by database trigger
      })
      .eq('stripe_customer_id', stripeCustomerId)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  /**
   * Get comprehensive Stripe customer data (replaces Redis customer data cache)
   */
  static async getStripeCustomerData(stripeCustomerId: string): Promise<StripeCustomerData | null> {
    const { data, error } = await supabaseAdmin
      .from('stripe_customers')
      .select('stripe_data')
      .eq('stripe_customer_id', stripeCustomerId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.stripe_data as StripeCustomerData || null;
  }

  /**
   * Store order sync data (replaces Redis order sync operations)
   */
  static async setOrderSyncData(orderId: string, syncData: OrderSyncData) {
    const { data, error } = await supabaseAdmin
      .from('order_sync_states')
      .upsert({
        order_id: orderId,
        stripe_session_id: syncData.stripeSessionId,
        sync_state: syncData.status,
        sync_attempts: syncData.attempts,
        last_sync_attempt: new Date(syncData.lastAttempt).toISOString(),
        order_data: syncData.orderData,
        error_data: syncData.error ? { error: syncData.error } : null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get order sync data (replaces Redis order sync lookups)
   */
  static async getOrderSyncData(orderId: string): Promise<OrderSyncData | null> {
    const { data, error } = await supabaseAdmin
      .from('order_sync_states')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    if (!data) return null;

    return {
      orderId: data.order_id || '',
      stripeSessionId: data.stripe_session_id || '',
      status: data.sync_state as any,
      attempts: data.sync_attempts || 0,
      lastAttempt: new Date(data.last_sync_attempt || '').getTime(),
      orderData: data.order_data,
      error: data.error_data?.error,
    };
  }

  // ============================================================================
  // CONTACT FORM & LEAD MANAGEMENT
  // ============================================================================

  /**
   * Submit contact form with enhanced tracking
   */
  static async submitContactForm(data: {
    name: string;
    email: string;
    service_type: 'fitness' | 'finance' | 'apps' | 'general';
    message: string;
    session_id: string;
    ip_address?: string;
    user_agent?: string;
    referrer?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    privacy_consent?: boolean;
    marketing_consent?: boolean;
  }) {
    // Calculate lead score
    const { data: leadScoreData, error: scoreError } = await supabase.rpc('calculate_lead_score', {
      service_type: data.service_type,
      utm_source: data.utm_source,
      referrer_domain: data.referrer ? new URL(data.referrer).hostname : undefined,
      message_length: data.message.length,
    });
    if (scoreError) throw scoreError;
    const leadScore = leadScoreData;

    // Hash IP address for privacy
    const ipHash = data.ip_address ? await this.hashForPrivacy(data.ip_address) : undefined;
    const userAgentFingerprint = data.user_agent ? this.createUserAgentFingerprint(data.user_agent) : undefined;
    const referrerDomain = data.referrer ? new URL(data.referrer).hostname : undefined;

    const { data: submission, error } = await supabase
      .from('contact_submissions')
      .insert({
        name: data.name,
        email: data.email,
        service_type: data.service_type,
        message: data.message,
        lead_score: leadScore,
        session_id: data.session_id,
        ip_address_hash: ipHash,
        user_agent_fingerprint: userAgentFingerprint,
        referrer_domain: referrerDomain,
        utm_source: data.utm_source,
        utm_medium: data.utm_medium,
        utm_campaign: data.utm_campaign,
        utm_term: data.utm_term,
        utm_content: data.utm_content,
        privacy_consent: data.privacy_consent || false,
        marketing_consent: data.marketing_consent || false,
        form_version: '2.0',
        submission_method: 'website_form',
      })
      .select()
      .single();

    if (error) throw error;
    return submission;
  }

  // ============================================================================
  // SESSION & BEHAVIOR TRACKING (Privacy-Focused)
  // ============================================================================

  /**
   * Track user session (replaces Redis session data)
   */
  static async trackSession(data: SessionData) {
    const { data: session, error } = await supabaseAdmin
      .from('user_sessions')
      .insert({
        session_id: data.sessionId,
        customer_id: data.customerId,
        ip_address_hash: data.ip_address ? await this.hashForPrivacy(data.ip_address) : undefined,
        user_agent_fingerprint: data.user_agent ? this.createUserAgentFingerprint(data.user_agent) : undefined,
        device_type: data.deviceType,
        browser_family: data.browser_family,
        os_family: data.os_family,
        country_code: data.country,
        utm_source: data.utmSource,
        utm_medium: data.utmMedium,
        utm_campaign: data.utmCampaign,
        started_at: new Date(data.startedAt).toISOString(),
        last_activity_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return session;
  }

  /**
   * Track page view
   */
  static async trackPageView(data: {
    session_id: string;
    customer_id?: string;
    page_path: string;
    page_title?: string;
    page_category?: string;
    load_time?: number;
    time_on_page?: number;
    scroll_depth?: number;
    interactions_count?: number;
    form_interactions?: boolean;
  }) {
    const { data: pageView, error } = await supabase
      .from('page_views')
      .insert({
        session_id: data.session_id,
        customer_id: data.customer_id,
        page_path: data.page_path,
        page_title: data.page_title,
        page_category: data.page_category,
        load_time: data.load_time,
        time_on_page: data.time_on_page,
        scroll_depth: data.scroll_depth,
        interactions_count: data.interactions_count || 0,
        form_interactions: data.form_interactions || false,
        viewed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return pageView;
  }

  /**
   * Track event
   */
  static async trackEvent(data: {
    session_id: string;
    customer_id?: string;
    event_type: string;
    event_category: string;
    event_action: string;
    event_label?: string;
    event_data?: any;
    event_value?: number;
    page_path?: string;
  }) {
    const { data: event, error } = await supabase
      .from('events')
      .insert({
        session_id: data.session_id,
        customer_id: data.customer_id,
        event_type: data.event_type,
        event_category: data.event_category,
        event_action: data.event_action,
        event_label: data.event_label,
        event_data: data.event_data,
        event_value: data.event_value,
        page_path: data.page_path,
        occurred_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return event;
  }

  // ============================================================================
  // CART & E-COMMERCE TRACKING (Replaces localStorage + Redis)
  // ============================================================================

  /**
   * Track cart session (replaces localStorage cart data)
   */
  static async trackCartSession(data: {
    session_id: string;
    customer_id?: string;
    cart_token: string;
    items: any[];
    item_count: number;
    cart_value: number;
    status?: 'active' | 'abandoned' | 'converted' | 'recovered';
  }) {
    const { data: cartSession, error } = await supabase
      .from('cart_sessions')
      .upsert({
        session_id: data.session_id,
        customer_id: data.customer_id,
        cart_token: data.cart_token,
        status: data.status || 'active',
        items: data.items,
        item_count: data.item_count,
        cart_value: data.cart_value,
        last_activity_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return cartSession;
  }

  /**
   * Get cart session
   */
  static async getCartSession(cartToken: string) {
    const { data, error } = await supabase
      .from('cart_sessions')
      .select('*')
      .eq('cart_token', cartToken)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Mark cart as abandoned
   */
  static async markCartAbandoned(cartToken: string) {
    const { data, error } = await supabase
      .from('cart_sessions')
      .update({
        status: 'abandoned',
        abandoned_at: new Date().toISOString(),
      })
      .eq('cart_token', cartToken)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ============================================================================
  // ORDER MANAGEMENT
  // ============================================================================

  /**
   * Create order record
   */
  static async createOrder(data: {
    customer_id: string;
    order_number: string;
    stripe_session_id?: string;
    stripe_payment_intent_id?: string;
    stripe_customer_id?: string;
    status?: string;
    subtotal: number;
    shipping_cost?: number;
    tax_amount?: number;
    discount_amount?: number;
    total_amount: number;
    currency?: string;
    shipping_name?: string;
    shipping_email?: string;
    shipping_phone?: string;
    shipping_address_line1?: string;
    shipping_address_line2?: string;
    shipping_city?: string;
    shipping_state?: string;
    shipping_postal_code?: string;
    shipping_country?: string;
    items: Array<{
      product_id: string;
      product_name: string;
      product_description?: string;
      sku?: string;
      variant_id?: string;
      variant_name?: string;
      variant_attributes?: any;
      unit_price: number;
      quantity: number;
      total_price: number;
      customization_data?: any;
    }>;
  }) {
    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_id: data.customer_id,
        order_number: data.order_number,
        stripe_session_id: data.stripe_session_id,
        stripe_payment_intent_id: data.stripe_payment_intent_id,
        stripe_customer_id: data.stripe_customer_id,
        status: data.status || 'pending',
        subtotal: data.subtotal,
        shipping_cost: data.shipping_cost || 0,
        tax_amount: data.tax_amount || 0,
        discount_amount: data.discount_amount || 0,
        total_amount: data.total_amount,
        currency: data.currency || 'USD',
        shipping_name: data.shipping_name,
        shipping_email: data.shipping_email,
        shipping_phone: data.shipping_phone,
        shipping_address_line1: data.shipping_address_line1,
        shipping_address_line2: data.shipping_address_line2,
        shipping_city: data.shipping_city,
        shipping_state: data.shipping_state,
        shipping_postal_code: data.shipping_postal_code,
        shipping_country: data.shipping_country || 'US',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = data.items.map(item => ({
      order_id: order.id,
      ...item,
    }));

    const { data: items, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems)
      .select();

    if (itemsError) throw itemsError;

    return { order, items };
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(orderId: string, updates: {
    status?: string;
    payment_status?: string;
    fulfillment_status?: string;
    printful_order_id?: number;
    tracking_number?: string;
    shipping_carrier?: string;
    paid_at?: string;
    shipped_at?: string;
    delivered_at?: string;
  }) {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ============================================================================
  // ANALYTICS & BUSINESS INTELLIGENCE
  // ============================================================================

  /**
   * Update daily metrics
   */
  static async updateDailyMetrics(date: string, metrics: {
    unique_visitors?: number;
    total_sessions?: number;
    page_views?: number;
    bounce_rate?: number;
    avg_session_duration?: number;
    contact_submissions?: number;
    qualified_leads?: number;
    lead_conversion_rate?: number;
    orders_created?: number;
    orders_completed?: number;
    revenue?: number;
    avg_order_value?: number;
    conversion_rate?: number;
    carts_created?: number;
    carts_abandoned?: number;
    cart_abandonment_rate?: number;
    cart_recovery_rate?: number;
    avg_page_load_time?: number;
    avg_api_response_time?: number;
  }) {
    const { data, error } = await supabaseAdmin
      .from('daily_metrics')
      .upsert({
        date,
        ...metrics,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Track API performance (replaces Redis monitoring)
   */
  static async trackApiPerformance(data: {
    endpoint: string;
    method: string;
    response_time: number;
    status_code: number;
    success: boolean;
    user_agent?: string;
    ip_address?: string;
    error_type?: string;
    error_message?: string;
  }) {
    const ipHash = data.ip_address ? await this.hashForPrivacy(data.ip_address) : undefined;
    const userAgentFingerprint = data.user_agent ? this.createUserAgentFingerprint(data.user_agent) : undefined;

    const { data: performance, error } = await supabaseAdmin
      .from('api_performance')
      .insert({
        endpoint: data.endpoint,
        method: data.method,
        response_time: data.response_time,
        status_code: data.status_code,
        success: data.success,
        user_agent_fingerprint: userAgentFingerprint,
        ip_address_hash: ipHash,
        error_type: data.error_type,
        error_message: data.error_message,
        occurred_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return performance;
  }

  // ============================================================================
  // PRIVACY & COMPLIANCE UTILITIES
  // ============================================================================

  /**
   * Hash data for privacy compliance
   */
  private static async hashForPrivacy(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data + 'djbuildit-salt'); // Add salt
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Create simplified user agent fingerprint for privacy
   */
  private static createUserAgentFingerprint(userAgent: string) {
    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Opera|Edg|Trident)/);
    const osMatch = userAgent.match(/(Windows|Mac OS|Linux|Android|iOS)/);
    const browser = browserMatch ? browserMatch[1] : 'Unknown';
    const os = osMatch ? osMatch[1] : 'Unknown';

    return `${browser}_${os}`;
  }

  // Add other methods as per original

}