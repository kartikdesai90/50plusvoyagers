import { SiteImage } from '@/site/components/site-image';
import type { Band } from '@/site/types/band';

type BandMediaProps = {
    band: Band;
    className?: string;
    /**
     * Set on the media that is visible before any scrolling. It is loaded
     * eagerly and given priority, because it is what the page is judged on.
     */
    priority?: boolean;
    /** Marks the slide the hero is currently showing. */
    active?: boolean;
};

/**
 * The one place a band's file becomes an element.
 *
 * A band shows a picture. It used to be able to show a film instead, which is
 * why this is still a component rather than an `<img>` written at each of the
 * two call sites: the eager-versus-lazy decision and the active-slide marker
 * are the same in both places, and one of them getting them wrong is how a
 * hero ends up loading its first frame lazily.
 *
 * The bands are drawn edge to edge at every width, so `sizes` is simply the
 * viewport — bounded above by the container's own ceiling, past which the
 * picture stops growing however wide the window gets.
 *
 * Slides other than the lead are deliberately pushed to the back of the queue.
 * They sit in the hero's box rather than below the fold, so the browser counts
 * them as visible and would otherwise fetch all four at full priority against
 * the one picture the visitor is actually looking at — four images that will
 * not be seen for at least the length of the autoplay interval.
 */
export function BandMedia({ band, className, priority = false, active = false }: BandMediaProps) {
    return (
        <SiteImage
            src={band.media_url}
            alt={band.media_alt}
            className={className}
            sizes="(max-width: 1180px) 100vw, 1180px"
            priority={priority}
            lowPriority={!priority}
            {...(active ? { 'data-active': '' } : {})}
        />
    );
}
