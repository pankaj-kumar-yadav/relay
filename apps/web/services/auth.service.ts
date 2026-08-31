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

export async function patchMeApi(input: { name: string }): Promise<AuthUser> {
  const data = await api<UserResponse>(AuthApiPath.ME, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return data.user;
}

export async function forgotPasswordApi(email: string): Promise<void> {
  await api(AuthApiPath.FORGOT_PASSWORD, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPasswordApi(input: {
  token: string;
  password: string;
}): Promise<void> {
  await api(AuthApiPath.RESET_PASSWORD, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function changePasswordApi(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await api(AuthApiPath.CHANGE_PASSWORD, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
