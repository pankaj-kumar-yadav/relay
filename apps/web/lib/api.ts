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

export async function api<T extends object>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const body = (await res.json().catch(() => ({}))) as Partial<ApiEnvelope<T>>;

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
