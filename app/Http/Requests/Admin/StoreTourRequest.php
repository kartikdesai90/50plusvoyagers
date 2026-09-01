<?php

namespace App\Http\Requests\Admin;

use App\Models\Tour;

/** A tour that does not exist yet, so no row is exempt from the code check. */
class StoreTourRequest extends TourRequest
{
    protected function existing(): ?Tour
    {
        return null;
    }
}
