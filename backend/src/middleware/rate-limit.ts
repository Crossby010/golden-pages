import type { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis.js';

interface RateLimitOptions {
  windowSeconds: number;
  maxRequests: number;
  keyPrefix: string;
}

export function rateLimit({
  windowSeconds,
  maxRequests,
  keyPrefix,
}: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.ip ||
        req.socket.remoteAddress ||
        'unknown';

      const key = `ratelimit:${keyPrefix}:${ip}`;

      const count = await redis.incr(key);

      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (count > maxRequests) {
        const ttl = await redis.ttl(key);
        res.status(429).json({
          message: 'Too many requests. Please try again later.',
          retryAfter: ttl,
        });
        return;
      }

      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - count));

      next();
    } catch (error) {
      // Don't block the request if Redis is down
      console.error('Rate limit error:', error);
      next();
    }
  };
}