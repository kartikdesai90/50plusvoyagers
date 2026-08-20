import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchCurrentAdmin, loginAdmin, logoutAdmin } from '@/admin/auth/auth-api';
import { AdminAuthContext, type AdminAuthContextValue } from '@/admin/auth/auth-context';
import type { AdminUser, AuthStatus, LoginCredentials } from '@/admin/auth/types';
import { http } from '@/shared/lib/axios';

/**
 * Owns the admin session. Mounted only for `/admin/*` routes (see
 * `AdminAuthBoundary`), so the public marketing pages never issue a session
 * request they have no use for.
 */
export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AdminUser | null>(null);
    const [status, setStatus] = useState<AuthStatus>('loading');

    /* Resolve any pre-existing session exactly once, before routes decide. */
    useEffect(() => {
        let active = true;

        fetchCurrentAdmin()
            .then((current) => {
                if (!active) return;
                setUser(current);
                setStatus('authenticated');
            })
            .catch(() => {
                if (!active) return;
                setUser(null);
                setStatus('unauthenticated');
            });

        return () => {
            active = false;
        };
    }, []);

    /*
     * A 401 from any admin call means the server-side session is gone (expired
     * or revoked elsewhere). Drop client state so the guarded routes redirect
     * instead of rendering a shell for a user who is no longer signed in.
     */
    useEffect(() => {
        const interceptor = http.interceptors.response.use(
            (response) => response,
            (error: unknown) => {
                const status = (error as { response?: { status?: number } })?.response?.status;

                if (status === 401) {
                    setUser(null);
                    setStatus('unauthenticated');
                }

                return Promise.reject(error instanceof Error ? error : new Error(String(error)));
            },
        );

        return () => http.interceptors.response.eject(interceptor);
    }, []);

    const login = useCallback(async (credentials: LoginCredentials) => {
        const authenticated = await loginAdmin(credentials);

        setUser(authenticated);
        setStatus('authenticated');

        return authenticated;
    }, []);

    const logout = useCallback(async () => {
        try {
            await logoutAdmin();
        } finally {
            /* Even if the request fails, stop treating the user as signed in. */
            setUser(null);
            setStatus('unauthenticated');
        }
    }, []);

    const value = useMemo<AdminAuthContextValue>(
        () => ({ user, status, login, logout }),
        [user, status, login, logout],
    );

    return <AdminAuthContext value={value}>{children}</AdminAuthContext>;
}
