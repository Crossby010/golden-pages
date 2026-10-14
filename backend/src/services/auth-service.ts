import { sql } from '../config/database.js';
import { redis } from '../config/redis.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  type JwtPayload,
} from '../utils/jwt.js';
import { AppError } from '../middleware/error-handler.js';

// ============================================
// TYPES
// ============================================

export interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'customer' | 'admin';
  created_at: string;
  last_login: string | null;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: SafeUser;
  tokens: AuthTokens;
}

// ============================================
// HELPERS
// ============================================

function toSafeUser(user: DbUser): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.created_at,
  };
}

function buildTokens(user: DbUser): AuthTokens {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

async function createSession(user: DbUser): Promise<void> {
  await redis.set(
    `session:${user.id}`,
    JSON.stringify({ userId: user.id, email: user.email, role: user.role }),
    { ex: 60 * 15 }
  );
}

async function destroySession(userId: string): Promise<void> {
  await redis.del(`session:${userId}`);
}

// ============================================
// FIND USER
// ============================================

export async function findUserByEmail(
  email: string
): Promise<DbUser | null> {
  const rows = (await sql`
    SELECT id, email, password_hash, name, role, created_at, last_login
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `) as DbUser[];

  return rows[0] || null;
}

export async function findUserById(id: string): Promise<DbUser | null> {
  const rows = (await sql`
    SELECT id, email, password_hash, name, role, created_at, last_login
    FROM users
    WHERE id = ${id}
    LIMIT 1
  `) as DbUser[];

  return rows[0] || null;
}

// ============================================
// REGISTER
// ============================================

export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<AuthResult> {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  const passwordHash = await hashPassword(password);

  const rows = (await sql`
    INSERT INTO users (email, password_hash, name, role)
    VALUES (${email}, ${passwordHash}, ${name}, 'customer')
    RETURNING id, email, password_hash, name, role, created_at, last_login
  `) as DbUser[];

  const user = rows[0];
  if (!user) throw new AppError('Failed to create user', 500);

  const tokens = buildTokens(user);

  await redis.set(
    `refresh:${user.id}:${tokens.refreshToken.slice(-16)}`,
    '1',
    { ex: 60 * 60 * 24 * 7 }
  );

  await createSession(user);

  return { user: toSafeUser(user), tokens };
}

// ============================================
// LOGIN
// ============================================

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResult> {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    throw new AppError('Invalid email or password', 401);
  }

  await sql`
    UPDATE users
    SET last_login = NOW()
    WHERE id = ${user.id}
  `;

  const tokens = buildTokens(user);

  await redis.set(
    `refresh:${user.id}:${tokens.refreshToken.slice(-16)}`,
    '1',
    { ex: 60 * 60 * 24 * 7 }
  );

  await createSession(user);

  return { user: toSafeUser(user), tokens };
}

// ============================================
// REFRESH
// ============================================

export async function refreshTokens(
  userId: string
): Promise<AuthTokens> {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return buildTokens(user);
}

// ============================================
// LOGOUT
// ============================================

export async function logoutUser(
  userId: string,
  refreshToken?: string
): Promise<void> {
  if (refreshToken) {
    await redis.del(`refresh:${userId}:${refreshToken.slice(-16)}`);
  }
  await destroySession(userId);
}

// ============================================
// GET PROFILE
// ============================================

export async function getProfile(userId: string): Promise<SafeUser> {
  const user = await findUserById(userId);
  if (!user) throw new AppError('User not found', 404);
  return toSafeUser(user);
}