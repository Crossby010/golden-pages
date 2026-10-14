import 'dotenv/config';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.length < 3) {
    throw new Error(`❌ Missing or invalid environment variable: ${key}`);
  }
  return value;
}

function requireStrongSecret(key: string, minLength = 32): string {
  const value = requireEnv(key);
  if (value.length < minLength) {
    throw new Error(
      `❌ ${key} must be at least ${minLength} characters (got ${value.length})`
    );
  }
  return value;
}

export const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CORS_ORIGIN: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim()),

  // JWT
  JWT_SECRET: requireStrongSecret('JWT_SECRET', 32),
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '15m',
  JWT_REFRESH_SECRET: requireStrongSecret('JWT_REFRESH_SECRET', 32),
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',

  // Neon
  DATABASE_URL: requireEnv('DATABASE_URL'),

  // Upstash
  UPSTASH_REDIS_REST_URL: requireEnv('UPSTASH_REDIS_REST_URL'),
  UPSTASH_REDIS_REST_TOKEN: requireEnv('UPSTASH_REDIS_REST_TOKEN'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: requireEnv('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY: requireEnv('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: requireEnv('CLOUDINARY_API_SECRET'),

  // Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  IS_PROD: process.env.NODE_ENV === 'production',
};