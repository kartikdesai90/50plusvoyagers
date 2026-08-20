<?php

namespace App\Enums;

/**
 * Whether a post is being written or has been published.
 *
 * Stored as a string, never a MySQL ENUM — an ENUM cannot gain a value without
 * rebuilding the table.
 */
enum PostStatus: string
{
    case Draft = 'draft';

    case Published = 'published';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Published => 'Published',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Draft => 'only staff can read it',
            self::Published => 'anyone can read it',
        };
    }
}
