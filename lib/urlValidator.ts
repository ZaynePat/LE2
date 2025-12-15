// URL validation utilities

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a URL string
 * Checks for:
 * - Valid URL format
 * - Supported protocols (http, https)
 * - Not empty
 * - Reasonable length
 */
export function validateURL(url: string): ValidationResult {
  // Check if empty
  if (!url || url.trim().length === 0) {
    return { valid: false, error: "URL cannot be empty" };
  }

  // Check length (prevent extremely long URLs)
  if (url.length > 2048) {
    return { valid: false, error: "URL is too long (max 2048 characters)" };
  }

  // Try to parse as URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    return { valid: false, error: "Invalid URL format" };
  }

  // Check protocol
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return { valid: false, error: "Only HTTP and HTTPS protocols are supported" };
  }

  // Check if hostname exists
  if (!parsedUrl.hostname) {
    return { valid: false, error: "URL must have a valid hostname" };
  }

  // Check for suspicious patterns (optional security checks)
  const hostname = parsedUrl.hostname.toLowerCase();
  
  // Prevent localhost/internal IPs (optional - uncomment if needed)
  // if (hostname === 'localhost' || hostname.startsWith('127.') || hostname.startsWith('192.168.')) {
  //   return { valid: false, error: "Local/internal URLs are not allowed" };
  // }

  return { valid: true };
}

/**
 * Normalizes a URL for comparison
 * Removes trailing slashes, converts to lowercase, etc.
 */
export function normalizeURL(url: string): string {
  try {
    const parsed = new URL(url);
    // Convert hostname to lowercase, remove trailing slash from pathname
    parsed.hostname = parsed.hostname.toLowerCase();
    if (parsed.pathname !== "/" && parsed.pathname.endsWith("/")) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.toString();
  } catch (e) {
    // If parsing fails, return original
    return url;
  }
}

/**
 * Sanitizes URL for safe storage
 * Trims whitespace and normalizes
 */
export function sanitizeURL(url: string): string {
  return normalizeURL(url.trim());
}
