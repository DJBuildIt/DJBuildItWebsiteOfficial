// Printful Webhook v2 Configuration Utility
// Programmatically configure webhooks since there's no UI

interface PrintfulWebhookConfig {
  default_url: string;
  expires_at?: string | null;
  events: Array<{
    type: string;
    url?: string;
    params?: any[];
  }>;
}

interface PrintfulWebhookResponse {
  code: number;
  result: {
    default_url: string;
    expires_at?: string;
    events: Array<{
      type: string;
      url?: string;
      params?: any[];
    }>;
    public_key: string;
    secret_key?: string; // Only returned when setting up
  };
}

class PrintfulWebhookManager {
  private apiKey: string;
  private storeId?: string;
  private baseUrl: string = 'https://api.printful.com';

  constructor(apiKey: string, storeId?: string) {
    this.apiKey = apiKey;
    this.storeId = storeId;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    if (this.storeId) {
      headers['X-PF-Store-Id'] = this.storeId;
    }

    return headers;
  }

  /**
   * Get current webhook configuration
   */
  async getWebhookConfig(): Promise<PrintfulWebhookResponse> {
    const response = await fetch(`${this.baseUrl}/v2/webhooks`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get webhook config: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Set up complete webhook configuration
   */
  async setupWebhooks(webhookUrl: string, expiresAt?: string): Promise<PrintfulWebhookResponse> {
    const config: PrintfulWebhookConfig = {
      default_url: webhookUrl,
      expires_at: expiresAt || null,
      events: [
        // Shipment events
        { type: 'shipment_sent' },
        { type: 'shipment_returned' },
        { type: 'shipment_out_of_stock' },
        { type: 'shipment_canceled' },
        { type: 'shipment_put_hold' },
        { type: 'shipment_put_hold_approval' },
        { type: 'shipment_remove_hold' },

        // Order events
        { type: 'order_created' },
        { type: 'order_updated' },
        { type: 'order_failed' },
        { type: 'order_canceled' },
        { type: 'order_put_hold' },
        { type: 'order_put_hold_approval' },
        { type: 'order_remove_hold' },
        { type: 'order_refunded' },

        // Catalog events (optional - configure only if needed)
        // { type: 'catalog_stock_updated', params: [{ product_ids: [your_product_ids] }] },
        // { type: 'catalog_price_changed' },

        // Mockup events (optional)
        // { type: 'mockup_task_finished' },
      ],
    };

    const response = await fetch(`${this.baseUrl}/v2/webhooks`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to setup webhooks: ${response.status} ${response.statusText} - ${error}`);
    }

    return await response.json();
  }

  /**
   * Add or update specific event configuration
   */
  async configureEvent(eventType: string, url?: string, params?: any[]): Promise<any> {
    const config = {
      type: eventType,
      url: url || undefined,
      params: params || [],
    };

    const response = await fetch(`${this.baseUrl}/v2/webhooks/${eventType}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to configure event ${eventType}: ${response.status} ${response.statusText} - ${error}`);
    }

    return await response.json();
  }

  /**
   * Disable specific event
   */
  async disableEvent(eventType: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/v2/webhooks/${eventType}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to disable event ${eventType}: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Disable all webhooks
   */
  async disableAllWebhooks(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/v2/webhooks`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to disable webhooks: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Configure catalog stock updates for specific products
   */
  async configureCatalogStockUpdates(productIds: number[], url?: string): Promise<any> {
    return await this.configureEvent('catalog_stock_updated', url, [
      { product_ids: productIds }
    ]);
  }
}

export default PrintfulWebhookManager;

// Convenience function for quick setup
export async function setupPrintfulWebhooks(
  apiKey: string, 
  webhookUrl: string, 
  storeId?: string
): Promise<{ publicKey: string; secretKey: string }> {
  const manager = new PrintfulWebhookManager(apiKey, storeId);
  
  try {
    const result = await manager.setupWebhooks(webhookUrl);
    
    
    return {
      publicKey: result.result.public_key,
      secretKey: result.result.secret_key || '',
    };
  } catch (error) {
    console.error('❌ Failed to configure Printful webhooks:', error);
    throw error;
  }
} 