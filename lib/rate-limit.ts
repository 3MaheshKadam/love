// ====================================================================
// In-Memory Rate Limiter
// Simple IP-based throttling for auth endpoints.
// For production at scale, replace with Redis-based rate limiting.
// ====================================================================

interface RateLimitEntry {
    count: number;
    firstRequest: number;
}

// Store: key (ip:endpoint) → { count, firstRequest timestamp }
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now - entry.firstRequest > 15 * 60 * 1000) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
    maxAttempts: number;
    windowMs: number; // time window in milliseconds
}

export const RATE_LIMITS = {
    LOGIN: { maxAttempts: 10, windowMs: 15 * 60 * 1000 },         // 10 per 15 min
    SIGNUP: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },         // 5 per 15 min
    FORGOT_PASSWORD: { maxAttempts: 3, windowMs: 15 * 60 * 1000 }, // 3 per 15 min
} as const;

function getClientIP(req: Request): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    const realIP = req.headers.get("x-real-ip");
    if (realIP) {
        return realIP;
    }
    return "unknown";
}

export function rateLimit(
    endpoint: string,
    req: Request,
    config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
    const ip = getClientIP(req);
    const key = `${ip}:${endpoint}`;
    const now = Date.now();

    const entry = rateLimitStore.get(key);

    // No previous requests or window expired → allow
    if (!entry || (now - entry.firstRequest) > config.windowMs) {
        rateLimitStore.set(key, { count: 1, firstRequest: now });
        return {
            allowed: true,
            remaining: config.maxAttempts - 1,
            resetAt: now + config.windowMs,
        };
    }

    // Within window
    if (entry.count >= config.maxAttempts) {
        return {
            allowed: false,
            remaining: 0,
            resetAt: entry.firstRequest + config.windowMs,
        };
    }

    // Increment
    entry.count += 1;
    rateLimitStore.set(key, entry);

    return {
        allowed: true,
        remaining: config.maxAttempts - entry.count,
        resetAt: entry.firstRequest + config.windowMs,
    };
}
