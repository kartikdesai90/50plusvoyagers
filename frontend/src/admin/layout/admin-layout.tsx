'use client';

import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { AdminBrand } from '@/admin/layout/admin-brand';
import { AdminNav } from '@/admin/layout/admin-nav';
import { AdminUserMenu } from '@/admin/layout/admin-user-menu';
import { useSidebar } from '@/admin/layout/use-sidebar';
import { cn } from '@/shared/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/shared/ui/sheet';

const SIDEBAR_ID = 'admin-sidebar';

/**
 * The admin shell: fixed sidebar from `lg` up, slide-over drawer below it.
 *
 * The desktop sidebar collapses to an icon rail via the header toggle; the
 * drawer is always full width, since a rail makes no sense on a phone.
 *
 * Note it does NOT run the marketing motion layer — `AdminBoot` releases the
 * first-paint cloak instead.
 */
export function AdminLayout({ children }: { children: ReactNode }) {
    const [isNavOpen, setIsNavOpen] = useState(false);
    const { isCollapsed, toggle } = useSidebar();

    return (
        <div className="admin-theme min-h-dvh bg-background text-foreground">
            {/* Desktop sidebar */}
            <aside
                id={SIDEBAR_ID}
                className={cn(
                    'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-card lg:flex',
                    'transition-[width] duration-200 ease-in-out motion-reduce:transition-none',
                    isCollapsed ? 'w-18' : 'w-68',
                )}
            >
                <div className={cn('flex h-16 items-center', isCollapsed ? 'px-3' : 'px-5')}>
                    <AdminBrand collapsed={isCollapsed} />
                </div>
                <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto px-3 py-4">
                    <AdminNav collapsed={isCollapsed} />
                </div>
            </aside>

            {/* Mobile drawer */}
            <Sheet open={isNavOpen} onOpenChange={setIsNavOpen}>
                <SheetContent side="left" title="Navigation" className="lg:hidden">
                    <div className="flex h-16 items-center px-5">
                        <AdminBrand />
                    </div>
                    <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
                        <AdminNav onNavigate={() => setIsNavOpen(false)} />
                    </div>
                </SheetContent>

                <div
                    className={cn(
                        'transition-[padding] duration-200 ease-in-out motion-reduce:transition-none',
                        isCollapsed ? 'lg:pl-18' : 'lg:pl-68',
                    )}
                >
                    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/85 px-4 backdrop-blur sm:px-6 lg:px-8">
                        <SheetTrigger
                            className="-ml-1 rounded-lg p-2 text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/25 lg:hidden"
                            aria-label="Open navigation"
                        >
                            <Menu className="size-5" />
                        </SheetTrigger>

                        <button
                            type="button"
                            onClick={toggle}
                            aria-controls={SIDEBAR_ID}
                            aria-expanded={!isCollapsed}
                            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            className="-ml-1 hidden rounded-lg p-2 text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/25 lg:inline-flex"
                        >
                            {isCollapsed ? (
                                <PanelLeftOpen className="size-5" aria-hidden="true" />
                            ) : (
                                <PanelLeftClose className="size-5" aria-hidden="true" />
                            )}
                        </button>

                        <div className="lg:hidden">
                            <AdminBrand className="[&_span:last-child]:hidden" />
                        </div>

                        <div className="ml-auto">
                            <AdminUserMenu />
                        </div>
                    </header>

                    <main className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
                        <div className="mx-auto w-full max-w-7xl">{children}</div>
                    </main>
                </div>
            </Sheet>
        </div>
    );
}
