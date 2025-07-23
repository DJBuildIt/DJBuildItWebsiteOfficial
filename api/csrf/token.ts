import { security } from '../../src/lib/security';
import { monitoring } from '../../src/lib/monitoring';

// ============================================================================
// CSRF TOKEN ENDPOINT
// ============================================================================

export default async function handler(req: Request): Promise<Response> {
  const startTime = performance.now();
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  // Apply security headers
  const securityHeaders = security.getSecurityHeaders();
  
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...securityHeaders }
    });
  }

  try {
    // Rate limiting check
    const rateLimitAllowed = await security.checkRateLimit(clientIP, 'api');
    if (!rateLimitAllowed) {
      monitoring.trackError('rate_limit_csrf', 'CSRF token rate limit exceeded', { clientIP });
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded' 
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...securityHeaders }
      });
    }

    // Generate CSRF token with IP binding for extra security
    const csrfToken = security.generateCSRFToken(clientIP);
    
    // Get cookie headers for CSRF token
    const csrfCookieHeaders = security.getCSRFCookieHeaders(csrfToken);
    
    // Track successful token generation
    const responseTime = performance.now() - startTime;
    monitoring.trackApiCall('/api/csrf/token', responseTime, true);

    return new Response(JSON.stringify({ 
      success: true,
      token: csrfToken,
      message: 'CSRF token generated successfully'
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json', 
        ...securityHeaders,
        ...csrfCookieHeaders
      }
    });

  } catch (error) {
    const responseTime = performance.now() - startTime;
    
    // Track error
    monitoring.trackApiCall('/api/csrf/token', responseTime, false);
    monitoring.trackError('csrf_token_error', 'CSRF token generation failed', {
      error: (error as Error).message,
      clientIP,
    });

    console.error('CSRF token error:', error);

    const nodeEnv = (globalThis as any).process?.env?.NODE_ENV;
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to generate CSRF token',
      debug: nodeEnv === 'development' ? (error as Error).message : undefined,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...securityHeaders }
    });
  }
} 