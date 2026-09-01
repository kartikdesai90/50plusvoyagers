<?php

namespace App\Http\Requests\Admin;

use App\Models\Tour;

/** A tour that already exists, and is allowed to keep its own code. */
class UpdateTourRequest extends TourRequest
{
    protected function existing(): ?Tour
    {
        $tour = $this->route('tour');

        return $tour instanceof Tour ? $tour : null;
    }
}
