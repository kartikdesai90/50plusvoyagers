'use client';

import type { ReactNode } from 'react';

import { AdminBrand } from '@/admin/layout/admin-brand';

/**
 * Shell for admin screens shown before a session exists — currently just login.
 *
 * It owns the theme class and the full-height background so pages render
 * content only. Previously each screen hand-rolled this wrapper, which meant
 * `admin-theme min-h-dvh bg-background` was written out in three places.
 */
export function AdminAuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="admin-theme flex min-h-dvh flex-col bg-background">
            <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
                <div className="w-full max-w-[26rem]">
                    <div className="mb-8 flex justify-center">
                        <AdminBrand />
                    </div>

                    {children}

                    <p className="mt-6 text-center text-xs text-muted-foreground">
                        Authorised personnel only. Activity may be monitored.
                    </p>
                </div>
            </div>
        </div>
    );
}
