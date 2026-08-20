import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'admin:sidebar-collapsed';

function readStoredPreference(): boolean {
    try {
        return window.localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
        /* Storage can throw in private mode — fall back to the expanded rail. */
        return false;
    }
}

/**
 * Collapse state for the desktop sidebar, persisted so the choice survives a
 * reload. Only consulted from `lg` up; below that the drawer owns navigation
 * and this value is ignored.
 */
export function useSidebar() {
    const [isCollapsed, setIsCollapsed] = useState(readStoredPreference);

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, isCollapsed ? '1' : '0');
        } catch {
            /* Persisting is best-effort; the toggle still works in-session. */
        }
    }, [isCollapsed]);

    const toggle = useCallback(() => setIsCollapsed((current) => !current), []);

    return { isCollapsed, toggle };
}
