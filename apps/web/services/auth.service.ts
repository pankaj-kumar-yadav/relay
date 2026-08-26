import { AuthApiPath } from '@/constants/auth.constant';
import { HttpStatus } from '@/constants/http.constant';
import { api, ApiError } from '@/lib/api';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
};

type UserResponse = { user: AuthUser };

export async function loginApi(email: string, password: string): Promise<AuthUser> {
  const data = await api<UserResponse>(AuthApiPath.LOGIN, {
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
  const data = await api<UserResponse>(AuthApiPath.REGISTER, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data.user;
}

export async function logoutApi(): Promise<void> {
  await api(AuthApiPath.LOGOUT, { method: 'POST' });
}

export async function getSessionApi(): Promise<AuthUser | null> {
  try {
    const data = await api<UserResponse>(AuthApiPath.SESSION);
    return data.user;
  } catch (err) {
    if (err instanceof ApiError && err.status === HttpStatus.UNAUTHORIZED) {
      return null;
    }
    throw err;
  }
}
