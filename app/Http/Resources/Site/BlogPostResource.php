<?php

namespace App\Http\Resources\Site;

use App\Models\BlogPost;
use Illuminate\Http\Request;

/**
 * One journal post in full, as its own page receives it.
 *
 * The card plus the two things only the article itself needs: the prose, and
 * what search engines should be told about it. Built on the card rather than
 * beside it so the title, byline and date on an article can never drift from
 * the ones on the card that led the reader to it.
 *
 * `body` is paragraphs rather than markup. The page renders a column of plain
 * text, so whatever an editor pasted is resolved to that here — the front end
 * is never handed HTML it would have to trust.
 *
 * @mixin BlogPost
 */
class BlogPostResource extends BlogPostCardResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),

            'body' => $this->paragraphs(),
            'tags' => $this->tags ?? [],

            /*
             * For the page's own `<head>`. Null where an editor wrote nothing,
             * because the front end already knows what to fall back to — the
             * title and the excerpt — and a resource guessing at it here would
             * be a second opinion on the same question.
             */
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'canonical_url' => $this->canonical_url,
        ];
    }
}
