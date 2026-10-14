import { api, tokenStorage } from '@/lib/api';
import type { AuthResponse, User } from '@/types/auth';

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

export const authService = {
  async register(
    name: string,
    email: string,
    password: string
  ): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', {
      name,
      email,
      password,
    });
    tokenStorage.set(data.tokens.accessToken, data.tokens.refreshToken);
    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    tokenStorage.set(data.tokens.accessToken, data.tokens.refreshToken);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout', {
        refreshToken: tokenStorage.getRefresh(),
      });
    } catch {
      // ignore
    } finally {
      tokenStorage.clear();
    }
  },

  async me(): Promise<User> {
    const { data } = await api.get<{ user: User }>('/auth/me');
    return data.user;
  },

  async getStats(): Promise<UserStats> {
    const { data } = await api.get<UserStats>('/auth/admin/stats');
    return data;
  },
};