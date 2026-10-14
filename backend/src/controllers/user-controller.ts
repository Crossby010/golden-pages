import type { Request, Response, NextFunction } from 'express';
import { sql } from '../config/database.js';

export async function listUsers(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const rows = (await sql`
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.created_at,
        u.last_login,
        COALESCE(COUNT(DISTINCT o.id), 0)::int AS order_count,
        COALESCE(SUM(o.total), 0)::float AS total_spent
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id AND o.status = 'completed'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `) as {
      id: string;
      name: string;
      email: string;
      role: string;
      created_at: string;
      last_login: string | null;
      order_count: number;
      total_spent: number;
    }[];

    res.json({
      users: rows.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.created_at,
        lastLogin: u.last_login,
        orderCount: u.order_count,
        totalSpent: u.total_spent,
      })),
    });
  } catch (error) {
    next(error);
  }
}