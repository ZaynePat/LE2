// Simple in-memory rate limiter
// Tracks requests per IP address

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxRequests?: number; // default: 10
  windowMs?: number; // default: 60000 (1 minute)
}

export function rateLimit(config: RateLimitConfig = {}) {
  const maxRequests = config.maxRequests || 10;
  const windowMs = config.windowMs || 60000; // 1 minute

  return {
    check: (identifier: string): { allowed: boolean; remaining: number; resetTime: number } => {
      const now = Date.now();
      const record = store[identifier];

      // No record or expired window - create new
      if (!record || record.resetTime < now) {
        store[identifier] = {
          count: 1,
          resetTime: now + windowMs,
        };
        return {
          allowed: true,
          remaining: maxRequests - 1,
          resetTime: store[identifier].resetTime,
        };
      }

      // Within window - check limit
      if (record.count < maxRequests) {
        record.count++;
        return {
          allowed: true,
          remaining: maxRequests - record.count,
          resetTime: record.resetTime,
        };
      }

      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
      };
    },
  };
}

// Helper to get client IP from request
export function getClientIP(request: Request): string {
  // Check common headers set by proxies/load balancers
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to a default (not ideal but works for local dev)
  return "unknown";
}
