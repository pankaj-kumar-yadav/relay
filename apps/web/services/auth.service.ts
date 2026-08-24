import { api, ApiError } from '@/lib/api';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
};

type UserResponse = { user: AuthUser };

export async function loginApi(email: string, password: string): Promise<AuthUser> {
  const data = await api<UserResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return data.user;
}

export async function registerApi(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthUser> {
  const data = await api<UserResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data.user;
}

export async function logoutApi(): Promise<void> {
  await api('/auth/logout', { method: 'POST' });
}

export async function getSessionApi(): Promise<AuthUser | null> {
  try {
    const data = await api<UserResponse>('/auth/session');
    return data.user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      return null;
    }
    throw err;
  }
}
