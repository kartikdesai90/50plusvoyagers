'use client';

import {
    AlertCircle,
    CalendarDays,
    Compass,
    MessageSquareQuote,
    RefreshCw,
    Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { PageHeader } from '@/admin/components/page-header';
import { StatCard, StatCardSkeleton, type Stat } from '@/admin/components/stat-card';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { useAdminAuth } from '@/admin/auth/auth-context';

/**
 * Placeholder figures. There is no statistics endpoint yet — these exist to
 * establish the layout, not to report anything. They are labelled as sample
 * data in the UI so nobody mistakes them for real numbers.
 */
const PLACEHOLDER_STATS: Stat[] = [
    {
        id: 'departures',
        label: 'Upcoming departures',
        value: '12',
        icon: CalendarDays,
        trend: { direction: 'up', value: '+2' },
        caption: 'Across the next six months',
    },
    {
        id: 'travellers',
        label: 'Registered travellers',
        value: '2,431',
        icon: Users,
        trend: { direction: 'up', value: '+118' },
        caption: 'Compared with last quarter',
    },
    {
        id: 'trips',
        label: 'Published trips',
        value: '28',
        icon: Compass,
        caption: 'Live on the public site',
    },
    {
        id: 'reviews',
        label: 'Traveller reviews',
        value: '4.8 / 5',
        icon: MessageSquareQuote,
        trend: { direction: 'up', value: '+0.1' },
        caption: 'Average across 2,400+ ratings',
    },
];

const SKELETON_COUNT = PLACEHOLDER_STATS.length;

type LoadState = 'loading' | 'ready' | 'error';

export default function AdminDashboardPage() {
    const { user } = useAdminAuth();
    const [state, setState] = useState<LoadState>('loading');
    const [stats, setStats] = useState<Stat[]>([]);
    const [reloadToken, setReloadToken] = useState(0);

    /*
     * Stands in for a real fetch so the loading and error states are wired and
     * exercised now. Swap the body for an API call when the endpoint lands.
     *
     * State is only set from the async callback — never synchronously in the
     * effect body — so this stays clear of cascading renders.
     */
    useEffect(() => {
        let active = true;

        const timer = setTimeout(() => {
            if (!active) return;
            setStats(PLACEHOLDER_STATS);
            setState('ready');
        }, 400);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [reloadToken]);

    /* Event handler, so setting state here is fine. */
    const reload = useCallback(() => {
        setState('loading');
        setReloadToken((token) => token + 1);
    }, []);

    const firstName = user?.name.split(' ')[0] ?? 'there';

    return (
        <div className="flex flex-col gap-8">
            <PageHeader
                title={`Welcome back, ${firstName}`}
                description="A snapshot of the 50+ Voyagers operation."
                actions={
                    <Button
                        variant="outline"
                        onClick={reload}
                        disabled={state === 'loading'}
                        aria-label="Refresh dashboard"
                    >
                        <RefreshCw
                            className={
                                state === 'loading'
                                    ? 'animate-spin motion-reduce:animate-none'
                                    : undefined
                            }
                        />
                        Refresh
                    </Button>
                }
            />

            {state === 'error' ? (
                <Alert variant="destructive">
                    <AlertCircle />
                    <AlertTitle>Could not load dashboard data</AlertTitle>
                    <AlertDescription className="flex flex-col items-start gap-3">
                        <span>Something went wrong while fetching your statistics.</span>
                        <Button variant="outline" size="sm" onClick={reload}>
                            <RefreshCw />
                            Try again
                        </Button>
                    </AlertDescription>
                </Alert>
            ) : (
                <section aria-label="Key statistics">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {state === 'loading'
                            ? Array.from({ length: SKELETON_COUNT }, (_, index) => (
                                  <StatCardSkeleton key={index} />
                              ))
                            : stats.map(({ id, ...stat }) => <StatCard key={id} {...stat} />)}
                    </div>
                </section>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardContent className="flex min-h-64 flex-col items-center justify-center gap-2 text-center">
                        <h2 className="text-sm font-medium text-foreground">Activity overview</h2>
                        <p className="max-w-sm text-sm text-muted-foreground">
                            Charts and recent activity will appear here once the reporting endpoints
                            are available.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex min-h-64 flex-col items-center justify-center gap-2 text-center">
                        <h2 className="text-sm font-medium text-foreground">Quick actions</h2>
                        <p className="max-w-xs text-sm text-muted-foreground">
                            Shortcuts to common tasks will be added alongside the first admin
                            module.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <p className="text-xs text-muted-foreground">
                Figures shown are sample data for layout purposes only.
            </p>
        </div>
    );
}
