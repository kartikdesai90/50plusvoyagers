import { ImageIcon, Loader2, UploadCloud, Video as VideoIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Field } from '@/admin/components/form-section';
import { Button } from '@/shared/ui/button';
import { compressImage } from '@/shared/lib/compress-image';
import { cn } from '@/shared/lib/utils';

export type UploadKind = 'image' | 'video';

/** What each kind offers the file picker, and accepts on a drop. */
const ACCEPTS: Record<UploadKind, string> = {
    image: 'image/jpeg,image/png,image/webp',
    video: 'video/mp4,video/webm',
};

type FileUploadFieldProps = {
    id: string;
    label: string;
    kind: UploadKind;
    file: File | null;
    onFileChange: (file: File | null) => void;
    /** What is already stored, if anything. */
    existingUrl?: string | null;
    /** Said under the preview when the file is the stored one. */
    existingCaption?: string;
    /** Replaces the empty well's wording where the default is not right. */
    emptyTitle?: string;
    emptyHint?: string;
    hint?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    /**
     * Whether a chosen picture is re-encoded as WebP before it is uploaded.
     *
     * Off for the fields whose endpoint does not accept WebP back — the
     * favicon being the one that matters, since a browser tab wants a PNG,
     * an SVG or an ICO and nothing else.
     */
    compress?: boolean;
};

/**
 * Choosing a file, and seeing it before it is uploaded.
 *
 * Two states, deliberately different shapes: an empty well that invites a file,
 * and — once there is one — a compact row that shows it, names it and offers
 * the two things anyone wants next. Nothing is uploaded until the form is
 * saved, so choosing the wrong file costs nothing.
 *
 * A dropped file of the wrong kind is ignored rather than accepted and then
 * rejected a screen later.
 *
 * Pictures are re-encoded as WebP on the way in — see `compressImage`, which
 * hands back the original whenever that would not be an improvement — so what
 * the preview names and sizes is already what will be uploaded.
 */
export function FileUploadField({
    id,
    label,
    kind,
    file,
    onFileChange,
    existingUrl = null,
    existingCaption = 'Currently stored',
    emptyTitle,
    emptyHint,
    hint,
    error,
    required = false,
    disabled = false,
    compress = true,
}: FileUploadFieldProps) {
    const input = useRef<HTMLInputElement>(null);
    const [isDragging, setDragging] = useState(false);
    const [isOptimising, setOptimising] = useState(false);
    /* Kept against the file it describes, so a saving is never reported for
       some later file that happens to be sitting in the field. */
    const [saving, setSaving] = useState<{ file: File; from: number } | null>(null);

    /* Released when it changes, or the tab would hold on to every file the
       editor looked at until it closed. */
    const chosen = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

    useEffect(
        () => () => {
            if (chosen) URL.revokeObjectURL(chosen);
        },
        [chosen],
    );

    const previewUrl = chosen ?? existingUrl;
    const Icon = kind === 'video' ? VideoIcon : ImageIcon;

    /**
     * Everything chosen arrives here, however it was chosen.
     *
     * The compressed file is what goes into the form, so the preview, the size
     * shown beside it and the bytes eventually uploaded are all the same file.
     */
    const receive = async (chosenFile: File | null) => {
        if (!chosenFile || !compress || kind !== 'image') {
            onFileChange(chosenFile);
            setSaving(null);

            return;
        }

        setOptimising(true);

        try {
            const result = await compressImage(chosenFile);

            onFileChange(result.file);
            setSaving(result.converted ? { file: result.file, from: result.originalSize } : null);
        } finally {
            setOptimising(false);
        }
    };

    const acceptDropped = (dropped: File | undefined) => {
        if (!dropped || disabled) return;
        if (!ACCEPTS[kind].split(',').includes(dropped.type)) return;

        void receive(dropped);
    };

    return (
        <Field label={label} htmlFor={id} error={error} hint={hint} required={required}>
            <input
                ref={input}
                id={id}
                type="file"
                accept={ACCEPTS[kind]}
                disabled={disabled || isOptimising}
                className="sr-only"
                onChange={(event) => void receive(event.target.files?.[0] ?? null)}
            />

            {previewUrl ? (
                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 p-2.5">
                    {kind === 'video' ? (
                        <video
                            className="aspect-video w-32 shrink-0 rounded-md object-cover"
                            src={previewUrl}
                            muted
                            loop
                            playsInline
                            controls
                        />
                    ) : (
                        <img
                            className="aspect-video w-32 shrink-0 rounded-md object-cover"
                            src={previewUrl}
                            alt=""
                        />
                    )}

                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <p className="truncate text-sm font-medium text-foreground">
                            {chosen ? (file?.name ?? 'Selected file') : 'Current file'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {chosen ? describe(file, saving) : existingCaption}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={disabled || isOptimising}
                                onClick={() => input.current?.click()}
                            >
                                {isOptimising ? 'Optimising…' : 'Replace'}
                            </Button>
                            {chosen ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={disabled || isOptimising}
                                    onClick={() => {
                                        onFileChange(null);
                                        setSaving(null);
                                        if (input.current) input.current.value = '';
                                    }}
                                >
                                    Remove
                                </Button>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    onDragOver={(event) => {
                        event.preventDefault();
                        if (!disabled) setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(event) => {
                        event.preventDefault();
                        setDragging(false);
                        acceptDropped(event.dataTransfer.files[0]);
                    }}
                    className={cn(
                        'flex flex-col items-center gap-2.5 rounded-lg border border-dashed px-5 py-7 text-center transition-colors',
                        isDragging ? 'border-brand bg-brand/5' : 'border-input bg-muted/20',
                        error ? 'border-destructive/60' : '',
                        'motion-reduce:transition-none',
                    )}
                >
                    <span className="flex size-10 items-center justify-center rounded-full bg-card text-muted-foreground shadow-xs">
                        {isOptimising ? (
                            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                        ) : isDragging ? (
                            <UploadCloud className="size-5" aria-hidden="true" />
                        ) : (
                            <Icon className="size-5" aria-hidden="true" />
                        )}
                    </span>

                    <div>
                        <p className="text-sm font-medium text-foreground">
                            {isOptimising
                                ? 'Optimising your picture…'
                                : (emptyTitle ??
                                  `Drop ${kind === 'video' ? 'a video' : 'a picture'} here`)}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {isOptimising
                                ? 'Resizing and converting it to WebP'
                                : (emptyHint ?? 'or choose one from your computer')}
                        </p>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={disabled || isOptimising}
                        onClick={() => input.current?.click()}
                    >
                        Choose a file
                    </Button>
                </div>
            )}
        </Field>
    );
}

/**
 * What is said under a chosen file's name.
 *
 * A saving is worth showing — it is the only sign the re-encode happened at
 * all — but only for the file it was measured on.
 */
function describe(file: File | null, saving: { file: File; from: number } | null): string {
    const size = formatSize(file?.size ?? 0);

    if (!file || saving?.file !== file) return `${size} · uploads when you save`;

    return `${formatSize(saving.from)} → ${size} WebP · uploads when you save`;
}

function formatSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
