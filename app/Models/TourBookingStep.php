<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTourInOrder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * One numbered point on a tour page.
 *
 * Three lists share this table — how to make a booking, the documents required,
 * and the travel and health guidelines — because they are structurally the same
 * thing: a number and a paragraph. Three tables would be one schema written out
 * three times, and every screen that edits one would be copied twice.
 *
 * The `kind` is what tells them apart, and the page asks for one at a time.
 */
class TourBookingStep extends Model
{
    use BelongsToTourInOrder;

    public const KIND_BOOKING = 'booking';

    public const KIND_DOCUMENTS = 'documents';

    public const KIND_GUIDELINES = 'guidelines';

    /** The three lists, in the order the page prints them. */
    public const KINDS = [self::KIND_BOOKING, self::KIND_DOCUMENTS, self::KIND_GUIDELINES];

    protected $fillable = [
        'tour_id',
        'kind',
        'step_number',
        'content',
        'display_order',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'step_number' => 'integer',
            'display_order' => 'integer',
        ];
    }

    /**
     * One of the three lists.
     *
     * @param  Builder<static>  $query
     */
    public function scopeOfKind(Builder $query, string $kind): void
    {
        $query->where('kind', $kind);
    }

    /**
     * Numbered order — these lists are printed "1, 2, 3" on the page, so the
     * number is the order rather than a label beside it.
     *
     * @param  Builder<static>  $query
     */
    public function scopeInOrder(Builder $query): void
    {
        $query->orderBy('step_number')->orderBy('id');
    }
}
