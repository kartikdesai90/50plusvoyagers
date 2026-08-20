<?php

namespace App\Enums;

/**
 * How a traveller told us what they thought.
 *
 * One kind of record, two ways of carrying it: words, or a film of someone
 * saying them. Splitting these into two modules would mean two of every screen
 * for what is, to the person reading the homepage, the same thing.
 */
enum FeedbackType: string
{
    case Text = 'text';

    case Video = 'video';

    public function label(): string
    {
        return match ($this) {
            self::Text => 'Text',
            self::Video => 'Video',
        };
    }

    /** The sentence that would not fit in a list of choices. */
    public function description(): string
    {
        return match ($this) {
            self::Text => 'a quote the traveller wrote',
            self::Video => 'a film of the traveller speaking',
        };
    }
}
