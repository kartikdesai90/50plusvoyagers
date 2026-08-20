export type AdminUser = {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
};

export type LoginCredentials = {
    email: string;
    password: string;
    remember?: boolean;
};

/**
 * `loading` covers the initial "do we already have a session?" resolution —
 * routes must not decide anything until it settles, or a refresh on a
 * protected page would bounce the user to the login screen.
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
