<?php

namespace App\Http\Requests\Admin;

use App\Enums\PostStatus;
use App\Models\BlogPost;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Validator;

/**
 * What a journal post is, described once for both writing and rewriting.
 *
 * Creating and editing differ in one place — which row an address may already
 * belong to — and expressing that by splitting the whole rule set over two
 * files would leave two lists to keep in agreement.
 */
abstract class BlogPostRequest extends FormRequest
{
    private const MAX_IMAGE = 10 * 1024;

    private const IMAGE_TYPES = 'image/jpeg,image/png,image/webp';

    public function authorize(): bool
    {
        return true;
    }

    /** The post being rewritten, or null while one is being created. */
    abstract protected function existing(): ?BlogPost;

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],

            /*
             * Optional because the server writes one from the title when it is
             * left empty. An address an editor typed is never quietly changed —
             * they are told instead.
             */
            'slug' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('blog_posts', 'slug')->ignore($this->existing()?->getKey()),
            ],

            'excerpt' => ['nullable', 'string', 'max:500'],
            'content' => ['nullable', 'string', 'max:200000'],

            'image_file' => ['nullable', 'file', 'mimetypes:'.self::IMAGE_TYPES, 'max:'.self::MAX_IMAGE],

            'category' => ['nullable', 'string', 'max:80'],
            'tags' => ['nullable', 'array', 'max:20'],
            'tags.*' => ['nullable', 'string', 'max:40'],
            'author_id' => ['nullable', 'integer', Rule::exists('users', 'id')],
            /*
             * The name under the title, when it is not a member of staff. Most
             * of this journal is written by members of the club, and a member
             * has no account here — which is the point of the column.
             */
            'author_name' => ['nullable', 'string', 'max:120'],

            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'canonical_url' => ['nullable', 'url', 'max:2048'],

            'is_featured' => ['boolean'],
            'status' => ['required', new Enum(PostStatus::class)],
            'published_at' => ['nullable', 'date'],
            'display_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'slug' => 'page address',
            'excerpt' => 'short description',
            'content' => 'post',
            'image_file' => 'featured image',
            'meta_title' => 'search title',
            'meta_description' => 'search description',
            'canonical_url' => 'preferred address',
            'author_id' => 'author',
            'author_name' => 'writer’s name',
            'display_order' => 'order',
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'title.required' => 'Give the post a title.',
            'slug.unique' => 'Another post already lives at that address. Try adding a word to tell them apart.',
            'slug.regex' => 'An address may only use lowercase letters, numbers and hyphens — for example: a-week-in-ladakh.',
            'image_file.mimetypes' => 'That file is not a JPG, PNG or WebP picture.',
            'image_file.max' => 'That picture is too large. Please keep it under 10 MB.',
        ];
    }

    /**
     * A post cannot be published with nothing in it.
     *
     * Checked here rather than in the screen because it has to hold however the
     * record is written — an empty post going live is not a validation nicety,
     * it is a blank page with our name on it.
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($this->input('status') !== PostStatus::Published->value) {
                    return;
                }

                if (blank($this->input('content')) && blank($this->existing()?->content)) {
                    $validator->errors()->add(
                        'content',
                        'Write the post before publishing it. Save it as a draft in the meantime.',
                    );
                }
            },
        ];
    }

    /** The address the editor asked for, or nothing — the controller writes one. */
    public function requestedSlug(): ?string
    {
        $slug = trim((string) $this->input('slug'));

        return $slug === '' ? null : $slug;
    }

    /**
     * The record's own fields, without the file — that is handled separately,
     * because storing it can fail in ways a validated array cannot.
     *
     * @return array<string, mixed>
     */
    public function postAttributes(): array
    {
        $validated = $this->validated();

        return [
            'title' => $validated['title'],
            'excerpt' => $validated['excerpt'] ?? null,
            'content' => $validated['content'] ?? null,
            'category' => $this->cleaned($validated['category'] ?? null),
            'tags' => $this->cleanTags($validated['tags'] ?? []),
            'author_id' => $validated['author_id'] ?? null,
            'author_name' => $this->cleaned($validated['author_name'] ?? null),
            'meta_title' => $validated['meta_title'] ?? null,
            'meta_description' => $validated['meta_description'] ?? null,
            'canonical_url' => $validated['canonical_url'] ?? null,
            'is_featured' => $this->boolean('is_featured'),
            'status' => $validated['status'],
            'published_at' => $validated['published_at'] ?? null,
            'display_order' => $validated['display_order'] ?? 0,
        ];
    }

    /**
     * @param  array<int, string|null>  $tags
     * @return array<int, string>|null
     */
    private function cleanTags(array $tags): ?array
    {
        $cleaned = array_values(array_unique(array_filter(
            array_map(fn ($tag) => trim((string) $tag), $tags),
            filled(...),
        )));

        return $cleaned === [] ? null : $cleaned;
    }

    private function cleaned(?string $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}
