import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Since we're using anonymous access
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

// ============================================================================
// SUPABASE SERVICE FUNCTIONS
// ============================================================================

export class SupabaseService {
  // Contact form submission
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
  }) {
    const { data: submission, error } = await supabase
      .from('contact_submissions')
      .insert({
        name: data.name,
        email: data.email,
        service_type: data.service_type,
        message: data.message,
        ip_address: data.ip_address,
        user_agent: data.user_agent,
        referrer: data.referrer,
        utm_source: data.utm_source,
        utm_medium: data.utm_medium,
        utm_campaign: data.utm_campaign,
        form_version: '2.0',
        submission_method: 'website_form',
      })
      .select()
      .single();

    if (error) throw error;
    return submission;
  }

  // Create or update customer
  static async createOrUpdateCustomer(data: {
    email?: string;
    name?: string;
    session_id: string;
    ip_address?: string;
    user_agent?: string;
    acquisition_source?: string;
    acquisition_campaign?: string;
  }) {
    // Try to find existing customer by email or create new anonymous customer
    let customerId: string;

    if (data.email) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', data.email)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
        // Update existing customer
        await supabase
          .from('customers')
          .update({
            name: data.name,
            last_visit_at: new Date().toISOString(),
            customer_type: 'lead',
          })
          .eq('id', customerId);
      } else {
        // Create new customer
        const { data: newCustomer, error } = await supabase
          .from('customers')
          .insert({
            email: data.email,
            name: data.name,
            customer_type: 'lead',
            acquisition_source: data.acquisition_source,
            acquisition_campaign: data.acquisition_campaign,
            first_visit_at: new Date().toISOString(),
            last_visit_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        customerId = newCustomer.id;
      }
    } else {
      // Create anonymous customer
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert({
          customer_type: 'anonymous',
          acquisition_source: data.acquisition_source,
          acquisition_campaign: data.acquisition_campaign,
          first_visit_at: new Date().toISOString(),
          last_visit_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      customerId = newCustomer.id;
    }

    return customerId;
  }

  // Track user session
  static async trackSession(data: {
    session_id: string;
    customer_id?: string;
    ip_address?: string;
    user_agent?: string;
    device_type?: 'mobile' | 'tablet' | 'desktop';
    browser?: string;
    operating_system?: string;
    referrer_url?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  }) {
    const { data: session, error } = await supabase
      .from('user_sessions')
      .upsert({
        session_id: data.session_id,
        customer_id: data.customer_id,
        ip_address: data.ip_address,
        user_agent: data.user_agent,
        device_type: data.device_type,
        browser: data.browser,
        operating_system: data.operating_system,
        referrer_url: data.referrer_url,
        utm_source: data.utm_source,
        utm_medium: data.utm_medium,
        utm_campaign: data.utm_campaign,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return session;
  }

  // Track page view
  static async trackPageView(data: {
    session_id: string;
    customer_id?: string;
    page_path: string;
    page_title?: string;
    page_category?: string;
    load_time?: number;
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
        viewed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return pageView;
  }

  // Track events
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

  // Track cart session
  static async trackCartSession(data: {
    session_id: string;
    customer_id?: string;
    cart_token: string;
    items: any[];
    item_count: number;
    cart_value: number;
    status?: 'active' | 'abandoned' | 'converted';
  }) {
    const { data: cartSession, error } = await supabase
      .from('cart_sessions')
      .upsert({
        session_id: data.session_id,
        customer_id: data.customer_id,
        cart_token: data.cart_token,
        items: data.items,
        item_count: data.item_count,
        cart_value: data.cart_value,
        status: data.status || 'active',
        last_activity_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return cartSession;
  }

  // Create order
  static async createOrder(data: {
    order_number: string;
    customer_id: string;
    stripe_session_id?: string;
    stripe_payment_intent_id?: string;
    subtotal: number;
    shipping_cost: number;
    tax_amount: number;
    total_amount: number;
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
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: data.order_number,
        customer_id: data.customer_id,
        stripe_session_id: data.stripe_session_id,
        stripe_payment_intent_id: data.stripe_payment_intent_id,
        subtotal: data.subtotal,
        shipping_cost: data.shipping_cost,
        tax_amount: data.tax_amount,
        total_amount: data.total_amount,
        shipping_name: data.shipping_name,
        shipping_email: data.shipping_email,
        shipping_phone: data.shipping_phone,
        shipping_address_line1: data.shipping_address_line1,
        shipping_address_line2: data.shipping_address_line2,
        shipping_city: data.shipping_city,
        shipping_state: data.shipping_state,
        shipping_postal_code: data.shipping_postal_code,
        shipping_country: data.shipping_country,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = data.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_description: item.product_description,
      sku: item.sku,
      variant_id: item.variant_id,
      variant_name: item.variant_name,
      variant_attributes: item.variant_attributes,
      unit_price: item.unit_price,
      quantity: item.quantity,
      total_price: item.total_price,
      customization_data: item.customization_data,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return order;
  }

  // Update order status
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
    const { data: order, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return order;
  }

  // Get customer analytics
  static async getCustomerAnalytics(customerId: string) {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        orders (
          id,
          total_amount,
          status,
          created_at
        ),
        user_sessions (
          id,
          started_at,
          pages_viewed,
          session_duration
        ),
        events (
          id,
          event_type,
          event_category,
          occurred_at
        )
      `)
      .eq('id', customerId)
      .single();

    if (error) throw error;
    return data;
  }

  // Get business metrics
  static async getBusinessMetrics(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('daily_metrics')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data;
  }
} 