import { ChevronsUpDown, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from '@/shared/router';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { useAdminAuth } from '@/admin/auth/auth-context';
import { paths } from '@/routes/paths';

function initialsOf(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

export function AdminUserMenu() {
    const { user, logout } = useAdminAuth();
    const navigate = useNavigate();
    const [isSigningOut, setIsSigningOut] = useState(false);

    if (!user) return null;

    const handleSignOut = async () => {
        setIsSigningOut(true);
        await logout();
        void navigate(paths.admin.login, { replace: true });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className="flex items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/25 data-[state=open]:bg-accent"
                aria-label="Open account menu"
            >
                <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/12 text-[13px] font-semibold text-brand"
                    aria-hidden="true"
                >
                    {initialsOf(user.name)}
                </span>
                <span className="hidden min-w-0 flex-col leading-tight sm:flex">
                    <span className="truncate text-sm font-medium text-foreground">
                        {user.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </span>
                <ChevronsUpDown
                    className="hidden size-4 shrink-0 text-muted-foreground sm:block"
                    aria-hidden="true"
                />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="min-w-60">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">{user.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    variant="destructive"
                    disabled={isSigningOut}
                    onSelect={(event) => {
                        /* Keep the menu mounted while the request is in flight. */
                        event.preventDefault();
                        void handleSignOut();
                    }}
                >
                    <LogOut />
                    {isSigningOut ? 'Signing out…' : 'Sign out'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
