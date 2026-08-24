import { api, ApiError } from './api';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
};

type UserResponse = { user: AuthUser };

export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await api<UserResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return data.user;
}

export async function register(input: {
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

export async function logout(): Promise<void> {
  await api('/auth/logout', { method: 'POST' });
}

export async function getSession(): Promise<AuthUser | null> {
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
