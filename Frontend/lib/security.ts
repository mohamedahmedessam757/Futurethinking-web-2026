import { Ratelimit } from "@upstash/ratelimit";
import { createClient } from "@vercel/kv";

// Initialize Redis client
// In development, if env vars are missing, we can fallback or throw warning
const kv = createClient({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

/**
 * AI Generation Rate Limit
 * Strategy: Sliding Window
 * Limit: 5 requests per 24 hours per user
 */
export const aiRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, "24 h"),
  analytics: true,
  prefix: "@upstash/ratelimit/ai",
});

/**
 * Auth Rate Limit (Brute force protection)
 * Limit: 10 requests per 60 seconds by IP
 */
export const authRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/auth",
});

export async function checkRateLimit(identifier: string, type: 'ai' | 'auth') {
  // If no Redis config (Dev mode), allow pass
  if (!process.env.KV_REST_API_URL) return { success: true, limit: 100, remaining: 99, reset: 0 };

  const limiter = type === 'ai' ? aiRateLimit : authRateLimit;
  const { success, limit, reset, remaining } = await limiter.limit(identifier);

  return { success, limit, reset, remaining };
}