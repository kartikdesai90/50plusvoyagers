'use client';

import { useEffect, type ReactNode } from 'react';

import { AdminAuthProvider } from '@/admin/auth/auth-provider';
import { releaseBootCloak } from '@/shared/lib/boot-cloak';

/**
 * Route boundary for the whole admin area.
 *
 * Two jobs:
 *  1. Mount the auth provider only for `/admin/*`.
 *  2. Release the marketing first-paint cloak. The admin panel deliberately
 *     does not run the motion layer, and the cloak is normally lifted by it —
 *     without this the panel would sit blank until the 2.5s failsafe fired.
 */
export function AdminBoot({ children }: { children: ReactNode }) {
    useEffect(() => {
        releaseBootCloak();
    }, []);

    return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
