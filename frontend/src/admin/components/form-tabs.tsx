import { useId, useState } from 'react';
import type * as React from 'react';

import { cn } from '@/shared/lib/utils';

export type FormTab = {
    /** Stable across renders — it is what the selection is remembered by. */
    id: string;
    label: string;
    /** Said under the strip when this tab is the one showing. */
    description?: string;
    panel: React.ReactNode;
};

/**
 * One screen holding two or three forms that are edited separately.
 *
 * For a module that is really several bands of one page — each with its own
 * fields and its own save — rather than a single record with sections. Sections
 * scroll past each other and share a save button; tabs do neither, which is
 * the honest shape when saving one has nothing to do with the other.
 *
 * Every panel stays mounted, hidden with `hidden` rather than unmounted. An
 * editor who half-filled a card, looked at the other tab and came back would
 * otherwise find their work gone — and a form that loses what is typed into it
 * teaches people not to trust the screen.
 *
 * Keyboard and screen-reader behaviour is the ARIA tabs pattern: one stop in
 * the tab order, arrow keys between the tabs, and each panel named by the tab
 * that opens it.
 */
export function FormTabs({ tabs }: { tabs: FormTab[] }) {
    const ids = useId();
    const [active, setActive] = useState(tabs[0]?.id);

    const current = tabs.find((tab) => tab.id === active) ?? tabs[0];

    /* Arrow keys move the selection and the focus together, which is what the
       pattern asks for — a tab that is focused but not selected is a tab an
       editor has to press a second key to open. */
    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
        if (step === 0) return;

        event.preventDefault();

        const at = tabs.findIndex((tab) => tab.id === current?.id);
        const next = tabs[(at + step + tabs.length) % tabs.length];

        setActive(next.id);
        document.getElementById(`${ids}-${next.id}-tab`)?.focus();
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <div
                    role="tablist"
                    aria-label="Sections"
                    onKeyDown={onKeyDown}
                    className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1"
                >
                    {tabs.map((tab) => {
                        const isActive = tab.id === current?.id;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                id={`${ids}-${tab.id}-tab`}
                                aria-selected={isActive}
                                aria-controls={`${ids}-${tab.id}-panel`}
                                /* Only the selected tab is a tab stop; the
                                   others are reached with the arrow keys. */
                                tabIndex={isActive ? 0 : -1}
                                onClick={() => setActive(tab.id)}
                                className={cn(
                                    'rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
                                    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                    isActive
                                        ? 'bg-muted text-foreground'
                                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                                )}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {current?.description ? (
                    <p className="px-1 text-xs/relaxed text-muted-foreground">
                        {current.description}
                    </p>
                ) : null}
            </div>

            {tabs.map((tab) => (
                <div
                    key={tab.id}
                    role="tabpanel"
                    id={`${ids}-${tab.id}-panel`}
                    aria-labelledby={`${ids}-${tab.id}-tab`}
                    hidden={tab.id !== current?.id}
                >
                    {tab.panel}
                </div>
            ))}
        </div>
    );
}
