import type { VercelRequest, VercelResponse } from '@vercel/node';

type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const LOCAL_DEV_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
]);

const rateLimitStore = new Map<string, RateLimitEntry>();

function getAllowedOrigins(req: VercelRequest): Set<string> {
  const allowedOrigins = new Set(LOCAL_DEV_ORIGINS);
  const forwardedHost = req.headers['x-forwarded-host'];
  const hostHeader = typeof forwardedHost === 'string' ? forwardedHost : req.headers.host;
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol =
    typeof forwardedProto === 'string'
      ? forwardedProto
      : hostHeader?.startsWith('localhost') || hostHeader?.startsWith('127.0.0.1')
        ? 'http'
        : 'https';

  if (hostHeader) {
    allowedOrigins.add(`${protocol}://${hostHeader}`);
  }

  return allowedOrigins;
}

function getOrigin(req: VercelRequest): string | null {
  const rawOrigin = req.headers.origin;

  if (typeof rawOrigin !== 'string') {
    return null;
  }

  try {
    return new URL(rawOrigin).origin;
  } catch {
    return null;
  }
}

function getClientAddress(req: VercelRequest): string {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor[0]?.trim()) {
    return forwardedFor[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }

  return req.socket.remoteAddress ?? 'unknown';
}

function setRateLimitHeaders(
  res: VercelResponse,
  config: RateLimitConfig,
  remaining: number,
  resetAt: number,
) {
  res.setHeader('X-RateLimit-Limit', String(config.maxRequests));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, remaining)));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
}

function pruneExpiredEntries(now: number) {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export function guardApiRequest(
  req: VercelRequest,
  res: VercelResponse,
  routeKey: string,
  config: RateLimitConfig,
): boolean {
  const allowedOrigins = getAllowedOrigins(req);
  const origin = getOrigin(req);

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  if (req.method === 'OPTIONS') {
    if (origin && !allowedOrigins.has(origin)) {
      res.status(403).json({ error: 'Origin not allowed' });
      return false;
    }

    res.status(200).end();
    return false;
  }

  if (origin && !allowedOrigins.has(origin)) {
    res.status(403).json({ error: 'Origin not allowed' });
    return false;
  }

  const now = Date.now();
  pruneExpiredEntries(now);

  const clientAddress = getClientAddress(req);
  const rateLimitKey = `${routeKey}:${clientAddress}`;
  const existingEntry = rateLimitStore.get(rateLimitKey);

  if (!existingEntry || existingEntry.resetAt <= now) {
    const resetAt = now + config.windowMs;
    rateLimitStore.set(rateLimitKey, { count: 1, resetAt });
    setRateLimitHeaders(res, config, config.maxRequests - 1, resetAt);
    return true;
  }

  if (existingEntry.count >= config.maxRequests) {
    setRateLimitHeaders(res, config, 0, existingEntry.resetAt);
    res.setHeader(
      'Retry-After',
      String(Math.max(1, Math.ceil((existingEntry.resetAt - now) / 1000))),
    );
    res.status(429).json({ error: 'Rate limit exceeded' });
    return false;
  }

  existingEntry.count += 1;
  rateLimitStore.set(rateLimitKey, existingEntry);
  setRateLimitHeaders(res, config, config.maxRequests - existingEntry.count, existingEntry.resetAt);
  return true;
}
