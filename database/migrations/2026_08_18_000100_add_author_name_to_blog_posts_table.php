<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Who wrote the post, when that is not a member of staff.
 *
 * `author_id` points at `users`, and it says so on purpose: it is the staff
 * member who filed the piece. But most of this journal is written by members of
 * the club, and a member is not a user of the admin panel and never should be —
 * giving one an account so their name can appear under an article would be
 * handing out a key to the building to print a byline.
 *
 * So the credit is a name rather than a relationship. Nullable: a post the team
 * wrote has no separate author to name, and the public byline falls back to the
 * staff author or to the club itself.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('blog_posts', function (Blueprint $table) {
            $table->string('author_name', 120)->nullable()->after('author_id');
        });
    }

    public function down(): void
    {
        Schema::table('blog_posts', function (Blueprint $table) {
            $table->dropColumn('author_name');
        });
    }
};
