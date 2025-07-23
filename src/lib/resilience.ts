// Advanced Error Recovery & Resilience System
// Enterprise-grade error handling, circuit breakers, and failover mechanisms

import { monitoring } from './monitoring';

// ============================================================================
// RESILIENCE CONFIGURATION
// ============================================================================

export const RESILIENCE_CONFIG = {
  // Circuit breaker settings
  circuitBreaker: {
    failureThreshold: 5, // Number of failures before opening circuit
    recoveryTimeout: 60000, // 1 minute timeout before trying again
    monitorWindow: 300000, // 5 minute sliding window
    halfOpenRetryCount: 3, // Number of retries in half-open state
  },
  
  // Retry settings
  retry: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    jitterMaxMs: 1000,
  },
  
  // Queue settings
  deadLetterQueue: {
    maxSize: 1000,
    retentionHours: 24,
    processingIntervalMs: 60000, // 1 minute
  },
  
  // Timeout settings
  timeouts: {
    apiCall: 30000, // 30 seconds
    checkoutFlow: 120000, // 2 minutes
    webhookProcessing: 60000, // 1 minute
  },
} as const;

// ============================================================================
// CIRCUIT BREAKER IMPLEMENTATION
// ============================================================================

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  totalRequests: number;
  totalFailures: number;
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: number;
  private lastSuccessTime?: number;
  private totalRequests = 0;
  private totalFailures = 0;
  private halfOpenRetryCount = 0;

  constructor(
    private name: string,
    private config = RESILIENCE_CONFIG.circuitBreaker
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        this.halfOpenRetryCount = 0;
        monitoring.trackError('circuit_breaker', `Circuit breaker ${this.name} moved to HALF_OPEN state`);
      } else {
        const error = new Error(`Circuit breaker ${this.name} is OPEN`);
        monitoring.trackError('circuit_breaker', error.message, { circuitName: this.name, state: this.state });
        throw error;
      }
    }

    this.totalRequests++;

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.successCount++;
    this.lastSuccessTime = Date.now();
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenRetryCount++;
      if (this.halfOpenRetryCount >= this.config.halfOpenRetryCount) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        monitoring.trackError('circuit_breaker', `Circuit breaker ${this.name} moved to CLOSED state after recovery`);
      }
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount = 0; // Reset failure count on success
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.totalFailures++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      monitoring.trackError('circuit_breaker', `Circuit breaker ${this.name} moved back to OPEN state after half-open failure`);
    } else if (this.state === CircuitState.CLOSED && this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      monitoring.trackError('circuit_breaker', `Circuit breaker ${this.name} OPENED after ${this.failureCount} failures`);
    }
  }

  private shouldAttemptReset(): boolean {
    return this.lastFailureTime !== undefined && 
           Date.now() - this.lastFailureTime >= this.config.recoveryTimeout;
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
    };
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenRetryCount = 0;
    monitoring.trackError('circuit_breaker', `Circuit breaker ${this.name} manually reset`);
  }
}

// ============================================================================
// RETRY MECHANISM WITH EXPONENTIAL BACKOFF
// ============================================================================

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  jitterMaxMs?: number;
  shouldRetry?: (error: Error) => boolean;
}

export class RetryableError extends Error {
  constructor(message: string, public retryable: boolean = true) {
    super(message);
    this.name = 'RetryableError';
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...RESILIENCE_CONFIG.retry, ...options };
  
  let lastError: Error;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Check if we should retry this error
      if (config.shouldRetry && !config.shouldRetry(lastError)) {
        throw lastError;
      }
      
      // If this is the last attempt, throw the error
      if (attempt === config.maxAttempts) {
        monitoring.trackError('retry_exhausted', `All ${config.maxAttempts} retry attempts failed`, {
          error: lastError.message,
          attempts: attempt,
        });
        throw lastError;
      }
      
      // Calculate delay with exponential backoff and jitter
      const baseDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
      const cappedDelay = Math.min(baseDelay, config.maxDelayMs);
      const jitter = Math.random() * config.jitterMaxMs;
      const delay = cappedDelay + jitter;
      
      monitoring.trackError('retry_attempt', `Retry attempt ${attempt} failed, waiting ${delay}ms`, {
        error: lastError.message,
        attempt,
        delay,
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// ============================================================================
// DEAD LETTER QUEUE
// ============================================================================

export interface DeadLetterItem {
  id: string;
  type: 'stripe_webhook' | 'printful_webhook' | 'api_call' | 'order_processing';
  payload: any;
  error: string;
  timestamp: number;
  attempts: number;
  lastAttempt: number;
}

class DeadLetterQueue {
  private queue: DeadLetterItem[] = [];
  private processingInterval?: NodeJS.Timeout;

  constructor(private config = RESILIENCE_CONFIG.deadLetterQueue) {
    this.startProcessing();
  }

  add(item: Omit<DeadLetterItem, 'id' | 'timestamp' | 'attempts' | 'lastAttempt'>): void {
    const deadLetterItem: DeadLetterItem = {
      ...item,
      id: `dlq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      attempts: 0,
      lastAttempt: 0,
    };

    this.queue.push(deadLetterItem);
    
    // Remove old items if queue is too large
    if (this.queue.length > this.config.maxSize) {
      this.queue = this.queue.slice(-this.config.maxSize);
    }

    monitoring.trackError('dead_letter_queue', `Item added to dead letter queue: ${item.type}`, {
      itemId: deadLetterItem.id,
      queueSize: this.queue.length,
    });
  }

  private startProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, this.config.processingIntervalMs);
  }

  private async processQueue(): Promise<void> {
    const now = Date.now();
    const retentionMs = this.config.retentionHours * 60 * 60 * 1000;
    
    // Remove expired items
    this.queue = this.queue.filter(item => now - item.timestamp < retentionMs);
    
    // Try to reprocess items
    for (const item of this.queue) {
      // Only try items that haven't been attempted recently (exponential backoff)
      const timeSinceLastAttempt = now - item.lastAttempt;
      const backoffDelay = Math.min(1000 * Math.pow(2, item.attempts), 300000); // Max 5 minutes
      
      if (timeSinceLastAttempt >= backoffDelay) {
        await this.retryItem(item);
      }
    }
  }

  private async retryItem(item: DeadLetterItem): Promise<void> {
    item.attempts++;
    item.lastAttempt = Date.now();

    try {
      await this.processItem(item);
      
      // Remove from queue on success
      this.queue = this.queue.filter(q => q.id !== item.id);
      
      monitoring.trackError('dead_letter_retry_success', `Dead letter item processed successfully: ${item.type}`, {
        itemId: item.id,
        attempts: item.attempts,
      });
    } catch (error) {
      monitoring.trackError('dead_letter_retry_failed', `Dead letter retry failed: ${item.type}`, {
        itemId: item.id,
        attempts: item.attempts,
        error: (error as Error).message,
      });
    }
  }

  private async processItem(item: DeadLetterItem): Promise<void> {
    switch (item.type) {
      case 'stripe_webhook':
        // Retry Stripe webhook processing
        await this.retryStripeWebhook(item.payload);
        break;
      case 'printful_webhook':
        // Retry Printful webhook processing
        await this.retryPrintfulWebhook(item.payload);
        break;
      case 'api_call':
        // Retry failed API call
        await this.retryApiCall(item.payload);
        break;
      case 'order_processing':
        // Retry order processing
        await this.retryOrderProcessing(item.payload);
        break;
      default:
        throw new Error(`Unknown dead letter item type: ${item.type}`);
    }
  }

  private async retryStripeWebhook(payload: any): Promise<void> {
    // Implement Stripe webhook retry logic
    const response = await fetch('/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Stripe webhook retry failed: ${response.status}`);
    }
  }

  private async retryPrintfulWebhook(payload: any): Promise<void> {
    // Implement Printful webhook retry logic
    const response = await fetch('/api/webhooks/printful', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Printful webhook retry failed: ${response.status}`);
    }
  }

  private async retryApiCall(payload: any): Promise<void> {
    // Implement API call retry logic
    const { url, method, headers, body } = payload;
    const response = await fetch(url, { method, headers, body });
    
    if (!response.ok) {
      throw new Error(`API call retry failed: ${response.status}`);
    }
  }

  private async retryOrderProcessing(payload: any): Promise<void> {
    // Implement order processing retry logic
    const response = await fetch('/api/orders/retry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Order processing retry failed: ${response.status}`);
    }
  }

  getStats() {
    const now = Date.now();
    return {
      totalItems: this.queue.length,
      itemsByType: this.queue.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      oldestItem: this.queue.length > 0 ? Math.min(...this.queue.map(item => item.timestamp)) : null,
      avgAttempts: this.queue.length > 0 ? 
        this.queue.reduce((sum, item) => sum + item.attempts, 0) / this.queue.length : 0,
    };
  }

  clear(): void {
    this.queue = [];
    monitoring.trackError('dead_letter_queue', 'Dead letter queue cleared manually');
  }

  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
  }
}

// ============================================================================
// RESILIENCE MANAGER
// ============================================================================

class ResilienceManager {
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private deadLetterQueue = new DeadLetterQueue();

  // Get or create circuit breaker for a service
  getCircuitBreaker(serviceName: string): CircuitBreaker {
    if (!this.circuitBreakers.has(serviceName)) {
      this.circuitBreakers.set(serviceName, new CircuitBreaker(serviceName));
    }
    return this.circuitBreakers.get(serviceName)!;
  }

  // Execute operation with circuit breaker and retry logic
  async executeWithResilience<T>(
    serviceName: string,
    operation: () => Promise<T>,
    retryOptions?: RetryOptions
  ): Promise<T> {
    const circuitBreaker = this.getCircuitBreaker(serviceName);
    
    try {
      return await circuitBreaker.execute(async () => {
        return await withRetry(operation, retryOptions);
      });
    } catch (error) {
      // Add to dead letter queue for later processing
      this.deadLetterQueue.add({
        type: 'api_call',
        payload: { serviceName, operation: operation.toString() },
        error: (error as Error).message,
      });
      throw error;
    }
  }

  // Add item to dead letter queue
  addToDeadLetterQueue(item: Omit<DeadLetterItem, 'id' | 'timestamp' | 'attempts' | 'lastAttempt'>): void {
    this.deadLetterQueue.add(item);
  }

  // Get comprehensive stats
  getStats() {
    const circuitBreakerStats = Array.from(this.circuitBreakers.entries()).map(([name, cb]) => ({
      name,
      ...cb.getStats(),
    }));

    return {
      circuitBreakers: circuitBreakerStats,
      deadLetterQueue: this.deadLetterQueue.getStats(),
    };
  }

  // Reset all circuit breakers
  resetAllCircuitBreakers(): void {
    this.circuitBreakers.forEach(cb => cb.reset());
    monitoring.trackError('resilience', 'All circuit breakers reset manually');
  }

  // Clean up resources
  shutdown(): void {
    this.deadLetterQueue.stop();
  }
}

// ============================================================================
// SINGLETON INSTANCE & UTILITY FUNCTIONS
// ============================================================================

export const resilience = new ResilienceManager();

// Utility function to check if an error should be retried
export const shouldRetryError = (error: Error): boolean => {
  // Retry network errors, timeouts, and 5xx status codes
  if (error.message.includes('NETWORK_ERROR') || 
      error.message.includes('TIMEOUT') ||
      error.message.includes('500') ||
      error.message.includes('502') ||
      error.message.includes('503') ||
      error.message.includes('504')) {
    return true;
  }
  
  // Don't retry 4xx client errors (except 429 rate limiting)
  if (error.message.includes('400') ||
      error.message.includes('401') ||
      error.message.includes('403') ||
      error.message.includes('404')) {
    return false;
  }
  
  if (error.message.includes('429')) {
    return true; // Retry rate limiting errors
  }
  
  // Retry RetryableError instances
  if (error instanceof RetryableError) {
    return error.retryable;
  }
  
  // Default to retrying
  return true;
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
  CircuitBreaker,
  DeadLetterQueue,
  ResilienceManager,
};

export default resilience; 