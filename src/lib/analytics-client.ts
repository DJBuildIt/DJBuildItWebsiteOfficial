export interface AnalyticsEventPayload {
  eventType: string;
  category: string;
  timestamp?: number;
  sessionId?: string;
  userId?: string;
  data?: Record<string, any>;
  context?: Record<string, any>;
  performance?: Record<string, any>;
  revenue?: {
    value: number;
    currency: string;
    transactionId?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Send an analytics event to the server-side tracker. Fails silently in
 * production so it never blocks the UI.
 */
export async function postAnalyticsEvent(payload: AnalyticsEventPayload): Promise<void> {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        timestamp: payload.timestamp || Date.now(),
      }),
    });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('postAnalyticsEvent failed', err);
    }
    // Swallow errors – analytics must never crash the app
  }
} 