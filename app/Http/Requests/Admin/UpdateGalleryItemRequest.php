<?php

namespace App\Http\Requests\Admin;

/**
 * A photograph that already exists. Editing its caption must not demand the
 * picture again.
 */
class UpdateGalleryItemRequest extends GalleryItemRequest
{
    protected function fileIsRequired(): bool
    {
        return false;
    }
}
