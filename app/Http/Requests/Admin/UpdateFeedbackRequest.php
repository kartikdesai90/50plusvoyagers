<?php

namespace App\Http\Requests\Admin;

use App\Models\Feedback;

/**
 * Feedback that already exists, and may be edited without its files being
 * supplied again.
 */
class UpdateFeedbackRequest extends FeedbackRequest
{
    protected function existing(): ?Feedback
    {
        $feedback = $this->route('feedback');

        return $feedback instanceof Feedback ? $feedback : null;
    }
}
