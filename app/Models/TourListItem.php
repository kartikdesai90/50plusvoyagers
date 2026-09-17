<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTourInOrder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * One unnumbered bullet on a tour page.
 *
 * Three lists share this table — the highlights under the opening prose, what
 * the price covers, and what it does not — because they are structurally the
 * same thing: a tour, a paragraph, and a place in the order. They were three
 * tables with identical columns, which is one schema written out three times.
 *
 * This is the same reasoning {@see TourBookingStep} already applies to the
 * three numbered lists. Applying it in one place and not the other was the
 * inconsistency, not the merge.
 *
 * The inclusions were the last to arrive. They had a thumbnail of their own,
 * which was the one thing that told them from an exclusion — when the design
 * dropped the picture, the difference went with it.
 *
 * The `kind` is what tells them apart, and the page asks for one at a time.
 */
class TourListItem extends Model
{
    use BelongsToTourInOrder;

    public const KIND_HIGHLIGHT = 'highlight';

    public const KIND_INCLUSION = 'inclusion';

    public const KIND_EXCLUSION = 'exclusion';

    /** The three lists this table holds, in the order the page prints them. */
    public const KINDS = [self::KIND_HIGHLIGHT, self::KIND_INCLUSION, self::KIND_EXCLUSION];

    protected $fillable = [
        'tour_id',
        'kind',
        'content',
        'display_order',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'display_order' => 'integer',
        ];
    }

    /**
     * One of the two lists.
     *
     * @param  Builder<static>  $query
     */
    public function scopeOfKind(Builder $query, string $kind): void
    {
        $query->where('kind', $kind);
    }
}
