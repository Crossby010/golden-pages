import { Redis } from '@upstash/redis';
import 'dotenv/config';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
  throw new Error('UPSTASH_REDIS_* env vars are not set');
}

export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

export async function testRedisConnection(): Promise<void> {
  try {
    await redis.ping();
    console.log('✅ Upstash Redis connected');
  } catch (error) {
    console.error('❌ Upstash Redis connection failed:', error);
    throw error;
  }
}