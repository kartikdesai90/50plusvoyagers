'use client';

import { useEffect } from 'react';

/**
 * Discourages casual copying of the page.
 *
 * Turns off the context menu, text selection, copy, cut and drag, and swallows
 * the keyboard shortcuts that open the developer tools or the page source.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT THIS IS NOT
 *
 * It is not protection, and nothing here should be relied on as though it were.
 * Every line of it runs in the visitor's own browser, which means the visitor
 * decides whether it runs at all. The developer tools in particular cannot be
 * blocked from inside a page: opening them before the page loads, using the
 * browser's own menu rather than a key, reading `view-source:`, disabling
 * JavaScript, or fetching the URL with anything that is not a browser all reach
 * the same markup with none of this in the way.
 *
 * What it does buy is friction against the casual case — a visitor who would
 * have dragged a photograph onto their desktop or right-clicked to save it, and
 * who now has to mean it. That is the whole of the benefit, and it is a real
 * one for a site whose photography is its own.
 *
 * Anything that genuinely must not reach a visitor cannot be sent to them. That
 * is a server decision, not a keyboard one.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Deliberately NOT blocked:
 *
 *   Form fields    a visitor filling in an enquiry has to be able to paste
 *                  their own email address, and select what they typed to fix
 *                  it. Blocking that breaks the form to protect nothing.
 *   Ctrl/Cmd+A     select-all is how somebody using a screen reader or a
 *                  magnifier navigates a page.
 *   Printing       a visitor printing an itinerary to take with them is the
 *                  behaviour this site exists to encourage.
 */

/** Fields where a visitor is typing, and must keep every editing convenience. */
function isEditable(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;

    if (target.isContentEditable) return true;

    const tag = target.tagName;

    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function useContentGuard(enabled = true) {
    useEffect(() => {
        if (!enabled) return;

        /* The right-click menu, which is where "save image as" lives. */
        const onContextMenu = (event: MouseEvent) => {
            if (isEditable(event.target)) return;

            event.preventDefault();
        };

        /* Copy, cut and drag of anything that is not a field being filled in. */
        const onClipboard = (event: ClipboardEvent) => {
            if (isEditable(event.target)) return;

            event.preventDefault();
        };

        const onDragStart = (event: DragEvent) => {
            if (isEditable(event.target)) return;

            event.preventDefault();
        };

        /*
         * The shortcuts that open the tools or the source.
         *
         * Deterrence rather than a barrier, for the reason set out above: the
         * same tools are two clicks away in every browser's own menu, where no
         * page can reach them. This only catches the reflex.
         */
        const onKeyDown = (event: KeyboardEvent) => {
            if (isEditable(event.target)) return;

            const key = event.key.toLowerCase();
            const ctrl = event.ctrlKey || event.metaKey;

            /* F12 on its own. */
            if (key === 'f12') {
                event.preventDefault();

                return;
            }

            /* Ctrl/Cmd+Shift+I / J / C — tools, console, element picker. */
            if (ctrl && event.shiftKey && ['i', 'j', 'c'].includes(key)) {
                event.preventDefault();

                return;
            }

            /* Ctrl/Cmd+U — view source. */
            if (ctrl && key === 'u') {
                event.preventDefault();

                return;
            }

            /* Ctrl/Cmd+C / X / S — copy, cut, save page. */
            if (ctrl && ['c', 'x', 's'].includes(key)) {
                event.preventDefault();
            }
        };

        document.addEventListener('contextmenu', onContextMenu);
        document.addEventListener('copy', onClipboard);
        document.addEventListener('cut', onClipboard);
        document.addEventListener('dragstart', onDragStart);
        document.addEventListener('keydown', onKeyDown);

        /* Selection is turned off in paint rather than by cancelling every
           `selectstart`, so the browser never begins a highlight it will be
           told to drop a moment later. */
        document.body.classList.add('voy-guarded');

        return () => {
            document.removeEventListener('contextmenu', onContextMenu);
            document.removeEventListener('copy', onClipboard);
            document.removeEventListener('cut', onClipboard);
            document.removeEventListener('dragstart', onDragStart);
            document.removeEventListener('keydown', onKeyDown);
            document.body.classList.remove('voy-guarded');
        };
    }, [enabled]);
}
