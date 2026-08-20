import { TrendingDown, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { cn } from '@/shared/lib/utils';

export type StatTrend = {
    direction: 'up' | 'down';
    value: string;
};

export type Stat = {
    id: string;
    label: string;
    value: string;
    icon: LucideIcon;
    trend?: StatTrend;
    caption?: string;
};

export function StatCard({ label, value, icon: Icon, trend, caption }: Omit<Stat, 'id'>) {
    const TrendIcon = trend?.direction === 'down' ? TrendingDown : TrendingUp;

    return (
        <Card className="gap-0 py-0 shadow-xs transition-shadow hover:shadow-sm">
            <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-medium text-muted-foreground">{label}</span>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <Icon className="size-[18px]" aria-hidden="true" />
                    </span>
                </div>

                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                        {value}
                    </span>
                    {trend ? (
                        <span
                            className={cn(
                                'inline-flex items-center gap-1 text-xs font-medium',
                                trend.direction === 'up' ? 'text-emerald-600' : 'text-amber-600',
                            )}
                        >
                            <TrendIcon className="size-3.5" aria-hidden="true" />
                            {trend.value}
                        </span>
                    ) : null}
                </div>

                {caption ? <p className="text-xs text-muted-foreground">{caption}</p> : null}
            </CardContent>
        </Card>
    );
}

/** Matches StatCard's box model exactly so there is no shift when data lands. */
export function StatCardSkeleton() {
    return (
        <Card className="gap-0 py-0 shadow-xs">
            <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="size-9 rounded-lg" />
                </div>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-32" />
            </CardContent>
        </Card>
    );
}
