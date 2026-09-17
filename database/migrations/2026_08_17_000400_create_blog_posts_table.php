<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The journal.
 *
 * A post carries three separate things, and the columns are grouped to say so:
 * what it is (title, address, excerpt, body), how it is filed (category, tags,
 * author), and how it is found (the SEO block). The last group matches the
 * shape every other publishable thing on this site will use, so a single
 * renderer can serve all of them later.
 *
 * Category is a string rather than a table on purpose. A journal with a handful
 * of categories does not need a second module to manage them, and the list an
 * editor picks from is assembled from what has actually been used. If
 * categories ever need their own descriptions or pages, that is the point at
 * which they earn a table.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blog_posts', function (Blueprint $table) {
            $table->id();

            $table->string('title');
            // What comes after /journal/ in the link. Unique, because it is the
            // address; two posts cannot live at the same one.
            $table->string('slug')->unique();
            // Quoted on the listing and, failing anything better, in search
            // results — so it has to stand up without the post around it.
            $table->text('excerpt')->nullable();
            $table->longText('content')->nullable();

            $table->string('image_path', 2048)->nullable();

            $table->string('category', 80)->nullable();
            // A short list of words. JSON rather than a pivot table for the
            // same reason as the category: nothing yet needs a tag to have a
            // page of its own.
            $table->json('tags')->nullable();
            // Staff-authored, so it points at `users` and never at a customer.
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();

            $table->string('meta_title')->nullable();
            $table->string('meta_description', 500)->nullable();
            $table->string('canonical_url', 2048)->nullable();

            $table->boolean('is_featured')->default(false);
            // draft · published
            $table->string('status', 20)->default('draft');
            // A moment in the future is a post scheduled to appear, not a live
            // one — which is why the public scope will check both.
            $table->timestamp('published_at')->nullable();
            $table->integer('display_order')->default(0);

            $table->timestamps();

            $table->index(['status', 'published_at'], 'blog_posts_public_index');
            $table->index(['is_featured', 'display_order'], 'blog_posts_featured_index');
            $table->index('category');
            $table->index('author_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_posts');
    }
};
