const SESSION_KEY = 'relay_dummy_session';

export const DEMO_EMAIL = 'john@doe.com';
export const DEMO_PASSWORD = 'password';

export function isLoggedIn(): boolean {
   if (typeof window === 'undefined') return false;
   return window.localStorage.getItem(SESSION_KEY) === '1';
}

export function login(email: string, password: string): boolean {
   if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) return false;
   window.localStorage.setItem(SESSION_KEY, '1');
   return true;
}

export function logout(): void {
   if (typeof window === 'undefined') return;
   window.localStorage.removeItem(SESSION_KEY);
}
