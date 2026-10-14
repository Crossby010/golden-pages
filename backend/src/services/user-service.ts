import { sql } from '../config/database.js';
import { redis } from '../config/redis.js';

// ============================================
// TYPES
// ============================================

export interface UserStats {
  totalUsers: number;
  onlineUsers: number;
  recentUsers: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  }[];
}

// ============================================
// GET USER STATS
// ============================================

export async function getUserStats(): Promise<UserStats> {
  // Total users
  const countRows = (await sql`
    SELECT COUNT(*)::int AS count FROM users
  `) as { count: number }[];

  const totalUsers = countRows[0]?.count || 0;

  // Online users — count unique session keys in Redis
  let onlineUsers = 0;
  try {
    const keys = await redis.keys('session:*');
    onlineUsers = keys.length;
  } catch {
    onlineUsers = 0;
  }

  // Recent users
  const recentRows = (await sql`
    SELECT id, name, email, created_at
    FROM users
    ORDER BY created_at DESC
    LIMIT 5
  `) as { id: string; name: string; email: string; created_at: string }[];

  return {
    totalUsers,
    onlineUsers,
    recentUsers: recentRows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      createdAt: u.created_at,
    })),
  };
}