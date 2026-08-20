<?php

namespace App\Http\Requests\Admin;

use App\Models\BlogPost;

/** A post that does not exist yet, so no row is exempt from the address check. */
class StoreBlogPostRequest extends BlogPostRequest
{
    protected function existing(): ?BlogPost
    {
        return null;
    }
}
