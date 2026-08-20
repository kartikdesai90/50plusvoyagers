<?php

namespace App\Http\Requests\Admin;

/**
 * A band that does not exist yet, so there is no file to fall back on.
 */
class StoreHeroBannerRequest extends HeroBannerRequest
{
    protected function fileIsRequired(): bool
    {
        return true;
    }
}
