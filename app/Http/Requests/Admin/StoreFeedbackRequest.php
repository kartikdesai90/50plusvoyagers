<?php

namespace App\Http\Requests\Admin;

use App\Models\Feedback;

/**
 * Feedback that does not exist yet, so nothing is already on the record to
 * satisfy a rule.
 */
class StoreFeedbackRequest extends FeedbackRequest
{
    protected function existing(): ?Feedback
    {
        return null;
    }
}
