<?php

namespace App\Http\Requests\Admin;

/**
 * A band that already exists, and may be edited without touching its picture.
 */
class UpdateHeroBannerRequest extends HeroBannerRequest
{
    /**
     * Never.
     *
     * A band that exists already has a picture, so editing its words must not
     * demand the picture again. This used to be true only while the kind of
     * media was unchanged — a band switching from a picture to a film needed a
     * new file, or the record would have claimed to be something its file was
     * not. There is one kind of media now, so there is nothing to switch to.
     */
    protected function fileIsRequired(): bool
    {
        return false;
    }
}
