import { http } from '@/shared/lib/axios';
import type { AdminUser, LoginCredentials } from '@/admin/auth/types';

/**
 * Admin auth endpoints. These live under the `web` middleware group on the
 * server, so authentication is session-cookie based — there is no token to
 * store, and `withCredentials` on the shared client does the work.
 */

const BASE = '/admin';

type UserEnvelope = { data: AdminUser };

/**
 * Primes the XSRF-TOKEN cookie. Cheap insurance before a state-changing call
 * from a tab that has been open long enough for the cookie to lapse.
 */
export async function ensureCsrfCookie(): Promise<void> {
    await http.get(`${BASE}/csrf-cookie`);
}

export async function fetchCurrentAdmin(): Promise<AdminUser> {
    const { data } = await http.get<UserEnvelope>(`${BASE}/me`);

    return data.data;
}

export async function loginAdmin(credentials: LoginCredentials): Promise<AdminUser> {
    await ensureCsrfCookie();

    const { data } = await http.post<UserEnvelope>(`${BASE}/login`, credentials);

    return data.data;
}

export async function logoutAdmin(): Promise<void> {
    await http.post(`${BASE}/logout`);
}

/**
 * Ask for a reset link.
 *
 * The reply is the same whether or not the address belongs to a staff account,
 * so there is nothing here to branch on — and nothing a caller could learn from
 * it about who works here.
 */
export async function requestAdminPasswordReset(email: string): Promise<string> {
    await ensureCsrfCookie();

    const { data } = await http.post<{ message: string }>(`${BASE}/forgot-password`, { email });

    return data.message;
}

export async function resetAdminPassword(payload: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
}): Promise<string> {
    await ensureCsrfCookie();

    const { data } = await http.post<{ message: string }>(`${BASE}/reset-password`, payload);

    return data.message;
}
