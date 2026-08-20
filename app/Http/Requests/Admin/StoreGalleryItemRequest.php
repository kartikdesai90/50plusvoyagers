<?php

namespace App\Http\Requests\Admin;

/** A photograph that does not exist yet, so there is no file to fall back on. */
class StoreGalleryItemRequest extends GalleryItemRequest
{
    protected function fileIsRequired(): bool
    {
        return true;
    }
}
