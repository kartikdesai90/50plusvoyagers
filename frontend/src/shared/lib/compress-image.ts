/**
 * Turning a chosen picture into the one we actually upload.
 *
 * Photographs come off a phone or a camera at a size no web page has any use
 * for — several thousand pixels wide and several megabytes heavy — and every
 * one of those bytes is paid for twice, once by the editor waiting on the save
 * and again by every visitor who loads the page. Re-encoding in the browser
 * spends a moment of the editor's time to spare both.
 *
 * The rule that keeps this honest is that it may never make things worse: a
 * file is only replaced when the replacement is genuinely smaller, and only
 * ever from a format there is something to gain by leaving. Anything this
 * cannot improve — or cannot decode at all — is handed back untouched and
 * uploaded exactly as it was chosen.
 */

/**
 * The long edge past which a picture is larger than any screen will use.
 *
 * Comfortably above a 2x retina hero, so nothing that is displayed is ever
 * scaled down to meet it; what this actually catches is the 6000px original
 * straight off a camera.
 */
const MAX_EDGE = 2560;

/** High enough that the result is indistinguishable from the source. */
const QUALITY = 0.92;

/** Formats a WebP re-encode can plausibly improve on. */
const CONVERTIBLE = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * Below this a PNG is a logo, an icon or a piece of flat artwork rather than a
 * photograph: there is nothing meaningful to save, and lossy re-encoding is
 * exactly the wrong thing to do to crisp edges and flat colour.
 */
const PNG_FLOOR = 200 * 1024;

export type CompressedImage = {
    /** What to upload — the original itself when nothing was gained. */
    file: File;
    /** What the editor chose, so the saving can be shown. */
    originalSize: number;
    /** Whether `file` is a different file from the one chosen. */
    converted: boolean;
};

/**
 * Re-encode a chosen picture as WebP, when that is an improvement.
 *
 * Never rejects: whatever goes wrong, the caller gets a file it can upload.
 */
export async function compressImage(file: File): Promise<CompressedImage> {
    if (!CONVERTIBLE.has(file.type)) return asChosen(file);
    if (file.type === 'image/png' && file.size < PNG_FLOOR) return asChosen(file);

    let bitmap: ImageBitmap | null = null;

    try {
        bitmap = await decode(file);

        const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));

        /* Already the format we would convert to, and no bigger than we would
           make it — re-encoding could only add a generation of loss. */
        if (file.type === 'image/webp' && scale === 1) return asChosen(file);

        if (scale < 1) {
            bitmap = await resize(bitmap, scale);
        }

        const blob = await encode(bitmap);

        /* Both guards matter: a browser without WebP encoding quietly hands
           back a PNG instead, and an already-tight JPEG can encode larger. */
        if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) {
            return asChosen(file);
        }

        return {
            file: new File([blob], webpName(file.name), {
                type: 'image/webp',
                lastModified: file.lastModified,
            }),
            originalSize: file.size,
            converted: true,
        };
    } catch {
        /* A picture this cannot read is still one the server may well accept,
           so a failure here costs the upload nothing. */
        return asChosen(file);
    } finally {
        bitmap?.close();
    }
}

function asChosen(file: File): CompressedImage {
    return { file, originalSize: file.size, converted: false };
}

/**
 * `from-image` applies the EXIF rotation a phone records rather than baking
 * in a sideways photograph. Older browsers reject the option outright, so the
 * plain call stands behind it.
 */
async function decode(file: File): Promise<ImageBitmap> {
    try {
        return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
        return await createImageBitmap(file);
    }
}

/**
 * Resampled by the decoder rather than by `drawImage`, which at these
 * reductions leaves visible aliasing however the smoothing is set.
 */
async function resize(bitmap: ImageBitmap, scale: number): Promise<ImageBitmap> {
    const resized = await createImageBitmap(bitmap, {
        resizeWidth: Math.round(bitmap.width * scale),
        resizeHeight: Math.round(bitmap.height * scale),
        resizeQuality: 'high',
    });

    bitmap.close();

    return resized;
}

async function encode(bitmap: ImageBitmap): Promise<Blob | null> {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const context = canvas.getContext('2d');
    if (!context) return null;

    context.drawImage(bitmap, 0, 0);

    return new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', QUALITY));
}

function webpName(name: string): string {
    return `${name.replace(/\.[^.]+$/, '')}.webp`;
}
