// Advanced Security & Fraud Detection System
// Enterprise-grade security, rate limiting, and threat detection

import { monitoring } from './monitoring';
import { resilience } from './resilience';
import crypto from 'crypto';

// ============================================================================
// SECURITY CONFIGURATION
// ============================================================================

export const SECURITY_CONFIG = {
  // Rate limiting configuration
  rateLimiting: {
    // API endpoints
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100, // per window
      message: 'Too many requests, please try again later',
    },
    
    // Checkout flow
    checkout: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10, // per window
      message: 'Too many checkout attempts, please wait before trying again',
    },
    
    // Contact forms
    contact: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5, // per window
      message: 'Too many contact form submissions, please wait before trying again',
    },
    
    // Failed login attempts
    auth: {
      windowMs: 30 * 60 * 1000, // 30 minutes
      maxRequests: 5, // per window
      message: 'Too many failed login attempts, account temporarily locked',
    },

    webhook: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 120, // High throughput for webhooks
      message: 'Too many webhook events received',
    }
  },
  
  // CSRF protection configuration
  csrf: {
    tokenLength: 32,
    maxAge: 60 * 60 * 1000, // 1 hour
    headerName: 'x-csrf-token',
    cookieName: '__Host-csrf-token',
    cookieOptions: {
      httpOnly: true,
      secure: true,
      sameSite: 'strict' as const,
      path: '/',
    },
  },
  
  // Fraud detection thresholds
  fraudDetection: {
    // Velocity checks
    velocity: {
      maxOrdersPerHour: 5,
      maxOrderValuePerHour: 500, // USD
      maxUniqueCardsPerHour: 3,
    },
    
    // Suspicious patterns
    patterns: {
      rapidFireCheckouts: 3, // orders within 5 minutes
      highValueOrders: 200, // USD threshold
      internationalOrders: true, // flag for review
      newCustomerHighValue: 100, // USD threshold for new customers
    },
    
    // Risk scoring
    riskScoring: {
      lowRisk: 0.3,
      mediumRisk: 0.6,
      highRisk: 0.8,
    },
  },
  
  // Input validation
  validation: {
    // String length limits
    maxStringLength: 1000,
    maxEmailLength: 254,
    maxNameLength: 100,
    maxAddressLength: 200,
    
    // Pattern validation
    emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phonePattern: /^\+?[\d\s\-\(\)]+$/,
    postalCodePattern: /^[\w\s\-]{3,10}$/,
    
    // Blocked patterns (enhanced)
    blockedPatterns: [
      /script/i,
      /javascript/i,
      /vbscript/i,
      /onload/i,
      /onerror/i,
      /onclick/i,
      /onmouseover/i,
      /onfocus/i,
      /onblur/i,
      /<.*>/,
      /SELECT.*FROM/i,
      /UNION.*SELECT/i,
      /DROP.*TABLE/i,
      /INSERT.*INTO/i,
      /UPDATE.*SET/i,
      /DELETE.*FROM/i,
      /CREATE.*TABLE/i,
      /ALTER.*TABLE/i,
      /EXEC.*\(/i,
      /eval\s*\(/i,
      /document\.cookie/i,
      /window\.location/i,
    ],
  },
  
  // Security headers (enhanced)
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://cdn.emailjs.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com https://api.emailjs.com https://api.printful.com https://www.google-analytics.com; frame-src https://js.stripe.com;",
  },
} as const;

// ============================================================================
// CSRF PROTECTION
// ============================================================================

interface CSRFToken {
  value: string;
  expiry: number;
  ipAddress?: string;
}

class CSRFProtection {
  private tokens = new Map<string, CSRFToken>();

  // Generate CSRF token
  generateToken(ipAddress?: string): string {
    const tokenValue = crypto.randomBytes(SECURITY_CONFIG.csrf.tokenLength).toString('hex');
    const expiry = Date.now() + SECURITY_CONFIG.csrf.maxAge;
    
    this.tokens.set(tokenValue, {
      value: tokenValue,
      expiry,
      ipAddress,
    });

    // Cleanup expired tokens
    this.cleanupExpiredTokens();
    
    return tokenValue;
  }

  // Verify CSRF token
  verifyToken(token: string, ipAddress?: string): boolean {
    const storedToken = this.tokens.get(token);
    
    if (!storedToken) {
      return false;
    }

    // Check expiry
    if (Date.now() > storedToken.expiry) {
      this.tokens.delete(token);
      return false;
    }

    // Optional IP binding for extra security
    if (storedToken.ipAddress && ipAddress && storedToken.ipAddress !== ipAddress) {
      return false;
    }

    // Token is valid - remove it (single use)
    this.tokens.delete(token);
    return true;
  }

  // Cleanup expired tokens
  private cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [token, data] of this.tokens.entries()) {
      if (now > data.expiry) {
        this.tokens.delete(token);
      }
    }
  }

  // Get cookie headers for CSRF token
  getCSRFCookieHeaders(token: string): Record<string, string> {
    const maxAge = Math.floor(SECURITY_CONFIG.csrf.maxAge / 1000);
    const cookieValue = `${SECURITY_CONFIG.csrf.cookieName}=${token}; Max-Age=${maxAge}; Path=${SECURITY_CONFIG.csrf.cookieOptions.path}; HttpOnly; Secure; SameSite=${SECURITY_CONFIG.csrf.cookieOptions.sameSite}`;
    
    return {
      'Set-Cookie': cookieValue,
    };
  }
}

// ============================================================================
// ENHANCED RATE LIMITER WITH PERSISTENCE
// ============================================================================

interface RateLimitRecord {
  count: number;
  resetTime: number;
  blocked: boolean;
}

class RateLimiter {
  private records = new Map<string, RateLimitRecord>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired records every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  // Check if request is allowed
  isAllowed(identifier: string, config: { windowMs: number; maxRequests: number; message: string }): boolean {
    const now = Date.now();
    const key = `${identifier}:${config.windowMs}`;
    
    let record = this.records.get(key);
    
    if (!record || now >= record.resetTime) {
      // Create new record or reset expired one
      record = {
        count: 1,
        resetTime: now + config.windowMs,
        blocked: false,
      };
      this.records.set(key, record);
      return true;
    }
    
    record.count++;
    
    if (record.count > config.maxRequests) {
      record.blocked = true;
      
      // Log security event
      monitoring.trackError('rate_limit_exceeded', `Rate limit exceeded for ${identifier}`, {
        identifier,
        count: record.count,
        limit: config.maxRequests,
        windowMs: config.windowMs,
      });
      
      return false;
    }
    
    return true;
  }

  // Get current rate limit status
  getStatus(identifier: string, config: { windowMs: number; maxRequests: number; message: string }) {
    const key = `${identifier}:${config.windowMs}`;
    const record = this.records.get(key);
    
    if (!record || Date.now() >= record.resetTime) {
      return {
        count: 0,
        limit: config.maxRequests,
        resetTime: Date.now() + config.windowMs,
        blocked: false,
      };
    }
    
    return {
      count: record.count,
      limit: config.maxRequests,
      resetTime: record.resetTime,
      blocked: record.blocked,
    };
  }

  // Get statistics
  getStats() {
    const now = Date.now();
    let activeRecords = 0;
    let blockedRecords = 0;
    
    for (const record of this.records.values()) {
      if (now < record.resetTime) {
        activeRecords++;
        if (record.blocked) {
          blockedRecords++;
        }
      }
    }
    
    return {
      activeRecords,
      blockedRecords,
      totalRecords: this.records.size,
      timestamp: now,
    };
  }

  // Cleanup expired records
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, record] of this.records.entries()) {
      if (now >= record.resetTime) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.records.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`Rate limiter cleanup: removed ${keysToDelete.length} expired records`);
    }
  }

  // Shutdown cleanup
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// ============================================================================
// FRAUD DETECTION
// ============================================================================

export interface FraudCheckResult {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  shouldBlock: boolean;
  flags: string[];
  recommendations: string[];
}

export interface OrderContext {
  customerId?: string;
  email: string;
  amount: number;
  currency: string;
  shippingAddress: {
    country: string;
    state?: string;
    city?: string;
    postalCode?: string;
  };
  billingAddress?: {
    country: string;
    state?: string;
    city?: string;
    postalCode?: string;
  };
  paymentMethod: {
    type: string;
    last4?: string;
    country?: string;
  };
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  timestamp: number;
}

class FraudDetector {
  private orderHistory: OrderContext[] = [];
  private blacklistedEmails = new Set<string>();
  private blacklistedIPs = new Set<string>();
  private suspiciousPatterns = new Map<string, number>();

  // Main fraud detection method
  async checkOrder(order: OrderContext): Promise<FraudCheckResult> {
    const flags: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    // Store order for future analysis
    this.orderHistory.push(order);
    
    // Keep only recent orders (last 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.orderHistory = this.orderHistory.filter(o => o.timestamp > oneDayAgo);

    // Check velocity limits
    const velocityCheck = this.checkVelocity(order);
    riskScore += velocityCheck.risk;
    flags.push(...velocityCheck.flags);
    recommendations.push(...velocityCheck.recommendations);

    // Check suspicious patterns
    const patternCheck = this.checkPatterns(order);
    riskScore += patternCheck.risk;
    flags.push(...patternCheck.flags);
    recommendations.push(...patternCheck.recommendations);

    // Check blacklists
    const blacklistCheck = this.checkBlacklists(order);
    riskScore += blacklistCheck.risk;
    flags.push(...blacklistCheck.flags);
    recommendations.push(...blacklistCheck.recommendations);

    // Check geographic anomalies
    const geoCheck = this.checkGeographic(order);
    riskScore += geoCheck.risk;
    flags.push(...geoCheck.flags);
    recommendations.push(...geoCheck.recommendations);

    // Check payment method anomalies
    const paymentCheck = this.checkPaymentMethod(order);
    riskScore += paymentCheck.risk;
    flags.push(...paymentCheck.flags);
    recommendations.push(...paymentCheck.recommendations);

    // Determine risk level
    const riskLevel = this.calculateRiskLevel(riskScore);
    const shouldBlock = riskLevel === 'high' || riskScore > SECURITY_CONFIG.fraudDetection.riskScoring.highRisk;

    return {
      riskScore: Math.min(riskScore, 1.0), // Cap at 1.0
      riskLevel,
      shouldBlock,
      flags: [...new Set(flags)], // Remove duplicates
      recommendations: [...new Set(recommendations)], // Remove duplicates
    };
  }

  private checkVelocity(order: OrderContext) {
    const flags: string[] = [];
    const recommendations: string[] = [];
    let risk = 0;

    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentOrders = this.orderHistory.filter(o => o.timestamp > oneHourAgo);

    // Check orders per hour
    const ordersByEmail = recentOrders.filter(o => o.email === order.email);
    if (ordersByEmail.length > SECURITY_CONFIG.fraudDetection.velocity.maxOrdersPerHour) {
      flags.push('excessive_order_velocity');
      recommendations.push('Review customer order frequency');
      risk += 0.3;
    }

    // Check order value per hour
    const totalValue = ordersByEmail.reduce((sum, o) => sum + o.amount, 0);
    if (totalValue > SECURITY_CONFIG.fraudDetection.velocity.maxOrderValuePerHour) {
      flags.push('excessive_value_velocity');
      recommendations.push('Review high-value order pattern');
      risk += 0.2;
    }

    // Check unique payment methods
    const uniqueCards = new Set(ordersByEmail.map(o => o.paymentMethod.last4).filter(Boolean));
    if (uniqueCards.size > SECURITY_CONFIG.fraudDetection.velocity.maxUniqueCardsPerHour) {
      flags.push('multiple_payment_methods');
      recommendations.push('Review multiple payment method usage');
      risk += 0.25;
    }

    return { risk, flags, recommendations };
  }

  private checkPatterns(order: OrderContext) {
    const flags: string[] = [];
    const recommendations: string[] = [];
    let risk = 0;

    // Check for rapid-fire checkouts
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const rapidOrders = this.orderHistory.filter(o => 
      o.email === order.email && o.timestamp > fiveMinutesAgo
    );
    
    if (rapidOrders.length >= SECURITY_CONFIG.fraudDetection.patterns.rapidFireCheckouts) {
      flags.push('rapid_fire_checkouts');
      recommendations.push('Review rapid checkout pattern');
      risk += 0.4;
    }

    // Check for high-value orders
    if (order.amount > SECURITY_CONFIG.fraudDetection.patterns.highValueOrders) {
      flags.push('high_value_order');
      recommendations.push('Manual review recommended for high-value order');
      risk += 0.2;
    }

    // Check for new customer high-value orders
    const customerHistory = this.orderHistory.filter(o => o.email === order.email);
    if (customerHistory.length <= 1 && order.amount > SECURITY_CONFIG.fraudDetection.patterns.newCustomerHighValue) {
      flags.push('new_customer_high_value');
      recommendations.push('Review first-time customer high-value order');
      risk += 0.3;
    }

    // Check for international orders
    if (order.shippingAddress.country !== 'US' && SECURITY_CONFIG.fraudDetection.patterns.internationalOrders) {
      flags.push('international_order');
      recommendations.push('Review international shipping order');
      risk += 0.1;
    }

    return { risk, flags, recommendations };
  }

  private checkBlacklists(order: OrderContext) {
    const flags: string[] = [];
    const recommendations: string[] = [];
    let risk = 0;

    // Check email blacklist
    if (this.blacklistedEmails.has(order.email.toLowerCase())) {
      flags.push('blacklisted_email');
      recommendations.push('Email is on blacklist - block order');
      risk += 1.0; // Immediate high risk
    }

    // Check IP blacklist
    if (order.ipAddress && this.blacklistedIPs.has(order.ipAddress)) {
      flags.push('blacklisted_ip');
      recommendations.push('IP address is on blacklist - block order');
      risk += 1.0; // Immediate high risk
    }

    return { risk, flags, recommendations };
  }

  private checkGeographic(order: OrderContext) {
    const flags: string[] = [];
    const recommendations: string[] = [];
    let risk = 0;

    // Check billing/shipping address mismatch
    if (order.billingAddress && order.shippingAddress) {
      if (order.billingAddress.country !== order.shippingAddress.country) {
        flags.push('country_mismatch');
        recommendations.push('Billing and shipping countries differ');
        risk += 0.15;
      }
    }

    // Check for high-risk countries (this is a simplified example)
    const higherRiskCountries = ['CN', 'RU', 'NG', 'PK'];
    if (higherRiskCountries.includes(order.shippingAddress.country)) {
      flags.push('high_risk_country');
      recommendations.push('Order from higher-risk country');
      risk += 0.2;
    }

    return { risk, flags, recommendations };
  }

  private checkPaymentMethod(order: OrderContext) {
    const flags: string[] = [];
    const recommendations: string[] = [];
    let risk = 0;

    // Check payment method country vs shipping country
    if (order.paymentMethod.country && order.shippingAddress.country) {
      if (order.paymentMethod.country !== order.shippingAddress.country) {
        flags.push('payment_country_mismatch');
        recommendations.push('Payment method and shipping countries differ');
        risk += 0.1;
      }
    }

    return { risk, flags, recommendations };
  }

  private calculateRiskLevel(riskScore: number): 'low' | 'medium' | 'high' {
    if (riskScore <= SECURITY_CONFIG.fraudDetection.riskScoring.lowRisk) {
      return 'low';
    } else if (riskScore <= SECURITY_CONFIG.fraudDetection.riskScoring.mediumRisk) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  // Blacklist management
  addToEmailBlacklist(email: string): void {
    this.blacklistedEmails.add(email.toLowerCase());
  }

  removeFromEmailBlacklist(email: string): void {
    this.blacklistedEmails.delete(email.toLowerCase());
  }

  addToIPBlacklist(ip: string): void {
    this.blacklistedIPs.add(ip);
  }

  removeFromIPBlacklist(ip: string): void {
    this.blacklistedIPs.delete(ip);
  }

  // Get fraud detection statistics
  getStats() {
    return {
      orderHistorySize: this.orderHistory.length,
      blacklistedEmails: this.blacklistedEmails.size,
      blacklistedIPs: this.blacklistedIPs.size,
      suspiciousPatterns: this.suspiciousPatterns.size,
      timestamp: Date.now(),
    };
  }
}

// ============================================================================
// INPUT VALIDATION & SANITIZATION
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue: string;
}

export class InputValidator {
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    let sanitizedValue = email.trim().toLowerCase();

    // Length check
    if (sanitizedValue.length > SECURITY_CONFIG.validation.maxEmailLength) {
      errors.push(`Email too long (max ${SECURITY_CONFIG.validation.maxEmailLength} characters)`);
    }

    // Pattern check
    if (!SECURITY_CONFIG.validation.emailPattern.test(sanitizedValue)) {
      errors.push('Invalid email format');
    }

    // Blocked pattern check
    if (this.containsBlockedPatterns(sanitizedValue)) {
      errors.push('Email contains prohibited content');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue,
    };
  }

  static validateString(value: string, maxLength: number = SECURITY_CONFIG.validation.maxStringLength): ValidationResult {
    const errors: string[] = [];
    let sanitizedValue = value.trim();

    // Length check
    if (sanitizedValue.length > maxLength) {
      errors.push(`String too long (max ${maxLength} characters)`);
    }

    // Blocked pattern check
    if (this.containsBlockedPatterns(sanitizedValue)) {
      errors.push('String contains prohibited content');
      sanitizedValue = this.sanitizeString(sanitizedValue);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue,
    };
  }

  static validatePhone(phone: string): ValidationResult {
    const errors: string[] = [];
    let sanitizedValue = phone.trim();

    // Pattern check
    if (!SECURITY_CONFIG.validation.phonePattern.test(sanitizedValue)) {
      errors.push('Invalid phone number format');
    }

    // Blocked pattern check
    if (this.containsBlockedPatterns(sanitizedValue)) {
      errors.push('Phone number contains prohibited content');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue,
    };
  }

  static validatePostalCode(postalCode: string): ValidationResult {
    const errors: string[] = [];
    let sanitizedValue = postalCode.trim().toUpperCase();

    // Pattern check
    if (!SECURITY_CONFIG.validation.postalCodePattern.test(sanitizedValue)) {
      errors.push('Invalid postal code format');
    }

    // Blocked pattern check
    if (this.containsBlockedPatterns(sanitizedValue)) {
      errors.push('Postal code contains prohibited content');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue,
    };
  }

  private static containsBlockedPatterns(value: string): boolean {
    return SECURITY_CONFIG.validation.blockedPatterns.some(pattern => pattern.test(value));
  }

  private static sanitizeString(value: string): string {
    // Remove HTML tags
    let sanitized = value.replace(/<[^>]*>/g, '');
    
    // Remove script content and dangerous patterns
    sanitized = sanitized.replace(/javascript:|vbscript:|onload|onerror|onclick|onmouseover|onfocus|onblur|eval\s*\(|document\.cookie|window\.location/gi, '');
    
    // Remove SQL injection patterns
    sanitized = sanitized.replace(/SELECT\s+.*\s+FROM|UNION\s+SELECT|DROP\s+TABLE|INSERT\s+INTO|UPDATE\s+.*\s+SET|DELETE\s+.*\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE|EXEC\s*\(/gi, '');
    
    return sanitized;
  }
}

// ============================================================================
// SECURITY MANAGER
// ============================================================================

class SecurityManager {
  private rateLimiter = new RateLimiter();
  private fraudDetector = new FraudDetector();
  private csrfProtection = new CSRFProtection();

  // Rate limiting middleware
  async checkRateLimit(identifier: string, endpoint: 'api' | 'checkout' | 'contact' | 'auth' | 'webhook'): Promise<boolean> {
    const config = SECURITY_CONFIG.rateLimiting[endpoint];
    return this.rateLimiter.isAllowed(identifier, config);
  }

  // CSRF protection methods
  generateCSRFToken(ipAddress?: string): string {
    return this.csrfProtection.generateToken(ipAddress);
  }

  verifyCSRFToken(token: string, ipAddress?: string): boolean {
    return this.csrfProtection.verifyToken(token, ipAddress);
  }

  getCSRFCookieHeaders(token: string): Record<string, string> {
    return this.csrfProtection.getCSRFCookieHeaders(token);
  }

  // Fraud detection
  async checkFraud(order: OrderContext): Promise<FraudCheckResult> {
    return await this.fraudDetector.checkOrder(order);
  }

  // Input validation
  validateInput(type: 'email' | 'string' | 'phone' | 'postalCode', value: string, maxLength?: number): ValidationResult {
    switch (type) {
      case 'email':
        return InputValidator.validateEmail(value);
      case 'string':
        return InputValidator.validateString(value, maxLength);
      case 'phone':
        return InputValidator.validatePhone(value);
      case 'postalCode':
        return InputValidator.validatePostalCode(value);
      default:
        throw new Error(`Unknown validation type: ${type}`);
    }
  }

  // Security headers
  getSecurityHeaders(): Record<string, string> {
    return { ...SECURITY_CONFIG.headers };
  }

  // Get comprehensive security stats
  getStats() {
    return {
      rateLimiting: this.rateLimiter.getStats(),
      fraudDetection: this.fraudDetector.getStats(),
      timestamp: Date.now(),
    };
  }

  // Blacklist management
  addToEmailBlacklist(email: string): void {
    this.fraudDetector.addToEmailBlacklist(email);
  }

  removeFromEmailBlacklist(email: string): void {
    this.fraudDetector.removeFromEmailBlacklist(email);
  }

  addToIPBlacklist(ip: string): void {
    this.fraudDetector.addToIPBlacklist(ip);
  }

  removeFromIPBlacklist(ip: string): void {
    this.fraudDetector.removeFromIPBlacklist(ip);
  }

  // Cleanup resources
  shutdown(): void {
    this.rateLimiter.shutdown();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const security = new SecurityManager();

// ============================================================================
// SECURITY HOOKS
// ============================================================================

export const useSecurityChecks = () => {
  const checkRateLimit = async (identifier: string, endpoint: 'api' | 'checkout' | 'contact' | 'auth' | 'webhook') => {
    const allowed = await security.checkRateLimit(identifier, endpoint);
    
    if (!allowed) {
      const message = SECURITY_CONFIG.rateLimiting[endpoint].message;
      monitoring.trackError('rate_limit_blocked', `Rate limit exceeded for ${identifier}`, {
        identifier,
        endpoint,
      });
      throw new Error(message);
    }
    
    return allowed;
  };

  const checkFraud = async (order: OrderContext) => {
    const result = await security.checkFraud(order);
    
    if (result.shouldBlock) {
      monitoring.trackError('fraud_blocked', `Fraudulent order blocked`, {
        email: order.email,
        riskScore: result.riskScore,
        flags: result.flags,
      });
      throw new Error('Order blocked due to security concerns');
    }
    
    return result;
  };

  const validateInput = (type: 'email' | 'string' | 'phone' | 'postalCode', value: string, maxLength?: number) => {
    const result = security.validateInput(type, value, maxLength);
    
    if (!result.isValid) {
      monitoring.trackError('validation_failed', `Input validation failed for ${type}`, {
        type,
        errors: result.errors,
        originalValue: value.length > 50 ? value.substring(0, 50) + '...' : value,
      });
      throw new Error(result.errors.join(', '));
    }
    
    return result.sanitizedValue;
  };

  return {
    checkRateLimit,
    checkFraud,
    validateInput,
    getSecurityHeaders: security.getSecurityHeaders.bind(security),
    generateCSRFToken: security.generateCSRFToken.bind(security),
    verifyCSRFToken: security.verifyCSRFToken.bind(security),
  };
};

export default security;