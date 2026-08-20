<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Where uploaded files go, and what happens to the ones nothing points at.
 *
 * Shared by every admin module that accepts a file, so the two rules that
 * matter are decided once: a visitor's file name is never used, and a file
 * shipped with the design is never ours to delete.
 */
class FileStore
{
    /**
     * Store an upload under a name of our own.
     *
     * The submitted file name can collide with another and can carry anything
     * at all. What is kept is the extension the file's own content justified,
     * which validation has already established.
     */
    public function put(UploadedFile $file, string $folder): string
    {
        $name = Str::uuid()->toString().'.'.$file->extension();

        return $file->storeAs($folder, $name, ['disk' => $this->disk()]);
    }

    /**
     * Remove a file nothing points at any more.
     *
     * A path that starts with a slash or a scheme is served straight out of the
     * public directory or from somewhere else entirely — part of the build, or
     * someone else's. Neither is ours to delete.
     */
    public function forget(?string $disk, ?string $path): void
    {
        if (blank($path) || Str::startsWith($path, ['/', 'http://', 'https://'])) {
            return;
        }

        Storage::disk($disk ?? $this->disk())->delete($path);
    }

    /**
     * Where a browser fetches a stored file from.
     *
     * Root-relative, never absolute. The front end serves the site and proxies
     * `/storage` back to this application, so a path is all a browser needs and
     * is the only form that survives the journey: an absolute URL built from
     * this application's own `APP_URL` names a host the visitor may not be able
     * to reach — `localhost` on a phone is the phone — and `next/image` refuses
     * to optimise a host it was not configured for, which fails the page rather
     * than the picture.
     */
    public function url(?string $disk, ?string $path): ?string
    {
        if (blank($path)) {
            return null;
        }

        if (Str::startsWith($path, ['/', 'http://', 'https://'])) {
            return $path;
        }

        $url = Storage::disk($disk ?? $this->disk())->url($path);

        /* Keep only the path, whatever the disk decided the host was. */
        return parse_url($url, PHP_URL_PATH) ?: $url;
    }

    public function disk(): string
    {
        return config('filesystems.default_media_disk', 'public');
    }
}
