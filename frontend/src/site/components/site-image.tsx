import Image from 'next/image';

/**
 * The site's own address, as the API writes it into a stored file's URL.
 *
 * Laravel returns an absolute URL for anything an editor uploaded — it builds
 * one from `APP_URL` — while the pictures that ship with the build are written
 * as plain paths. `next/image` treats those two very differently: a path is a
 * local file it may optimise freely, an absolute URL is a foreign host it
 * refuses outright unless the hostname is allow-listed, and that refusal is a
 * thrown error rather than a fallback.
 *
 * They are the same origin, so the honest fix is to stop calling one of them
 * remote. Trimming the prefix back to a path is also what keeps this working
 * across environments without an allow-list to maintain per deployment.
 */
const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? '';

function toLocalPath(src: string): string {
    if (SITE_ORIGIN && src.startsWith(`${SITE_ORIGIN}/`)) {
        return src.slice(SITE_ORIGIN.length);
    }

    return src;
}

type SiteImageProps = {
    src: string;
    alt: string;
    /** The widths this picture is actually drawn at, as a `sizes` list. */
    sizes: string;
    className?: string;
    /**
     * Set on the one picture that is on screen before any scrolling. It loads
     * eagerly, at high priority, and is announced in the document head.
     */
    priority?: boolean;
    /** Pushed behind everything else — for pictures that are in the DOM but not on screen. */
    lowPriority?: boolean;
} & Record<`data-${string}`, string | undefined>;

/**
 * A photograph, sized for the screen that is asking for it.
 *
 * Every picture on the site used to be a bare `<img>` pointed at whatever file
 * the editor uploaded — a 700 or 800 pixel wide original served intact to a
 * phone drawing it 371 pixels across. The bytes for the difference were
 * downloaded, decoded and thrown away, several times over on a page with a
 * dozen of them.
 *
 * `next/image` re-encodes on demand and emits a `srcset`, so the phone fetches
 * a phone-sized file and a desktop fetches a desktop-sized one. `sizes` is the
 * part that has to be right: it tells the browser how wide the picture will be
 * drawn *before* any layout has happened, and getting it wrong is how an image
 * ends up either blurry or as heavy as it was to begin with. Each caller passes
 * the widths its own CSS produces.
 *
 * `fill` rather than intrinsic dimensions because the sources are uploads whose
 * real pixel size nothing knows at build time. The callers all draw into a box
 * of a fixed height with `object-cover`, which is exactly the shape `fill`
 * expects; the only thing it asks in return is a positioned parent.
 */
export function SiteImage({
    src,
    alt,
    sizes,
    className,
    priority = false,
    lowPriority = false,
    ...rest
}: SiteImageProps) {
    /*
     * A record with no picture filed against it draws nothing.
     *
     * Two callers hand over `?? ''` for exactly that case. An empty `src` is
     * another of the errors `next/image` throws rather than absorbs, and one
     * unfilled row should not be able to take the homepage down with it.
     */
    if (!src) return null;

    const resolved = toLocalPath(src);

    /*
     * A picture from somewhere genuinely else is served as it is.
     *
     * The optimiser will not touch a host it has not been told about, and would
     * throw rather than degrade — which on a server-rendered page takes the
     * whole route down instead of one image. Nothing on the site does this
     * today; it is here so that the day someone points a record at a foreign
     * URL, the page shows the picture instead of an error.
     */
    const isRemote = /^https?:\/\//i.test(resolved);

    return (
        <Image
            src={resolved}
            alt={alt}
            fill
            sizes={sizes}
            className={className}
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : lowPriority ? 'low' : 'auto'}
            unoptimized={isRemote}
            {...rest}
        />
    );
}
