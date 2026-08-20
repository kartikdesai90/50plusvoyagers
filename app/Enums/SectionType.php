<?php

namespace App\Enums;

/**
 * Which band of the homepage a record belongs to.
 *
 * Stored as a string, never a MySQL ENUM — an ENUM cannot gain a value without
 * rebuilding the table, and the homepage will grow more bands than these two.
 */
enum SectionType: string
{
    /** The slider at the top of the page. */
    case Hero = 'hero';

    /** A full-width photo band with copy over it, between other sections. */
    case Banner = 'banner';

    /**
     * What an editor is shown. The stored value is never displayed.
     *
     * One word. A list of choices is read at a glance and drawn by the
     * operating system, where nothing can be done about a label too long for
     * the box — so what it needs to say goes in {@see description()} instead,
     * where there is room for it.
     */
    public function label(): string
    {
        return match ($this) {
            self::Hero => 'Hero',
            self::Banner => 'Banner',
        };
    }

    /** The sentence that would not fit in the list. */
    public function description(): string
    {
        return match ($this) {
            self::Hero => 'the slider at the top of the homepage',
            self::Banner => 'a full-width band further down the homepage',
        };
    }
}
