<?php

namespace App\Http\Requests\Admin;

use App\Models\BlogPost;

/** A post that already exists, and is allowed to keep its own address. */
class UpdateBlogPostRequest extends BlogPostRequest
{
    protected function existing(): ?BlogPost
    {
        $post = $this->route('blog');

        return $post instanceof BlogPost ? $post : null;
    }
}
