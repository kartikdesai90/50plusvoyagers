import { Loader2 } from 'lucide-react';
import { Link } from '@/shared/router';

import { Button } from '@/shared/ui/button';

/**
 * The two things to do with a filled-in form, in the same place on every screen.
 *
 * The bar follows the form down the page, so a long form never hides the way to
 * save it, and the saving state is on the button that started it rather than in
 * a banner elsewhere. It spans both columns of the form rather than sitting
 * under one of them: saving is the whole record, not the part of it the editor
 * happens to have scrolled to.
 */
export function FormActions({
    cancelHref,
    submitLabel,
    isSaving,
}: {
    cancelHref: string;
    submitLabel: string;
    isSaving: boolean;
}) {
    return (
        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2 border-t border-border bg-background/90 py-3 backdrop-blur">
            <Button asChild variant="ghost" size="sm">
                <Link to={cancelHref}>Cancel</Link>
            </Button>
            <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving ? (
                    <>
                        <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
                        Saving…
                    </>
                ) : (
                    submitLabel
                )}
            </Button>
        </div>
    );
}
