const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T | null;
  error: { code: string; message: string } | null;
};

const NO_REFRESH_PATHS = new Set(['/auth/refresh', '/auth/login', '/auth/register']);

function shouldAttemptRefresh(path: string, status: number, code: string) {
  if (NO_REFRESH_PATHS.has(path)) return false;
  return status === 401 || code === 'TOKEN_EXPIRED' || code === 'UNAUTHORIZED';
}

async function parseEnvelope<T>(res: Response): Promise<{
  res: Response;
  body: Partial<ApiEnvelope<T>>;
}> {
  const body = (await res.json().catch(() => ({}))) as Partial<ApiEnvelope<T>>;
  return { res, body };
}

async function rawFetch(path: string, init?: RequestInit) {
  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
}

async function refreshSession(): Promise<boolean> {
  const res = await rawFetch('/auth/refresh', { method: 'POST', body: '{}' });
  const { body } = await parseEnvelope(res);
  return res.ok && body.success !== false;
}

export async function api<T extends object>(path: string, init?: RequestInit): Promise<T> {
  const first = await parseEnvelope<T>(await rawFetch(path, init));
  let { res, body } = first;

  const code = body.error?.code || 'ERROR';
  if (!res.ok || body.success === false) {
    if (shouldAttemptRefresh(path, res.status, code)) {
      const refreshed = await refreshSession();
      if (refreshed) {
        ({ res, body } = await parseEnvelope<T>(await rawFetch(path, init)));
      }
    }
  }

  if (!res.ok || body.success === false) {
    throw new ApiError(
      res.status,
      body.error?.code || 'ERROR',
      body.error?.message || body.message || res.statusText,
    );
  }

  if (body.data == null) {
    throw new ApiError(res.status, 'ERROR', body.message || 'Empty response data');
  }

  return body.data;
}
