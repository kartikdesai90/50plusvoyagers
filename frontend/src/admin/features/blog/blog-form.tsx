import { useId, useRef, useState } from 'react';

import { AdvancedSettings } from '@/admin/components/advanced-settings';
import { FileUploadField } from '@/admin/components/file-upload-field';
import { FormActions } from '@/admin/components/form-actions';
import { Field, FormGrid, FormLayout, FormSection } from '@/admin/components/form-section';
import { SelectField } from '@/admin/components/select-field';
import { ToggleField } from '@/admin/components/toggle-field';
import { ContentEditor } from '@/admin/features/blog/content-editor';
import { toSlug } from '@/admin/features/blog/defaults';
import { TagInput } from '@/admin/features/blog/tag-input';
import type { BlogChoices, BlogInput, BlogPost, PostStatus } from '@/admin/features/blog/types';
import { paths } from '@/routes/paths';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

type BlogFormProps = {
    initial: BlogInput;
    /** What is already stored, on the edit screen. */
    existing?: BlogPost | null;
    choices: BlogChoices;
    isSaving: boolean;
    /** Keyed by the server's field names, so a 422 lands on the field at fault. */
    fieldErrors: Record<string, string>;
    submitLabel: string;
    onSubmit: (input: BlogInput, file: File | null) => void;
};

/**
 * The post form, shared by writing one and editing one.
 *
 * The wide column is the post: what it is called, what it says, what it shows,
 * and what a search engine is told about it — read straight down, in the order
 * it is written. The narrow one holds the decisions about it, which is where an
 * editor goes when they are not writing: whether it is out, and how it is filed.
 *
 * Splitting them is what makes this form scannable. It has fifteen fields, and
 * as one column it was a page and a half of scrolling with a display-order box
 * sitting between the prose and the picture.
 */
export function BlogForm({
    initial,
    existing = null,
    choices,
    isSaving,
    fieldErrors,
    submitLabel,
    onSubmit,
}: BlogFormProps) {
    const [form, setForm] = useState<BlogInput>(initial);
    const [file, setFile] = useState<File | null>(null);

    /* An address the editor has taken charge of stops following the title. */
    const slugTouched = useRef(existing !== null);

    const titleId = useId();
    const slugId = useId();
    const excerptId = useId();
    const contentId = useId();
    const imageId = useId();
    const categoryId = useId();
    const tagsId = useId();
    const authorId = useId();
    const writerId = useId();
    const metaTitleId = useId();
    const metaDescriptionId = useId();
    const canonicalId = useId();
    const statusId = useId();
    const publishedAtId = useId();
    const orderId = useId();
    const featuredId = useId();

    const change = <FieldName extends keyof BlogInput>(
        field: FieldName,
        value: BlogInput[FieldName],
    ) => setForm((current) => ({ ...current, [field]: value }));

    return (
        <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
                event.preventDefault();
                if (!isSaving) onSubmit(form, file);
            }}
            noValidate
        >
            <FormLayout
                main={
                    <>
                        <FormSection
                            title="The post"
                            description="What it is called, where it lives, and the line that stands in for it."
                        >
                            <FormGrid>
                                <Field
                                    label="Title"
                                    htmlFor={titleId}
                                    error={fieldErrors.title}
                                    required
                                >
                                    <Input
                                        id={titleId}
                                        value={form.title}
                                        disabled={isSaving}
                                        aria-invalid={Boolean(fieldErrors.title)}
                                        onChange={(event) => {
                                            const title = event.target.value;
                                            setForm((current) => ({
                                                ...current,
                                                title,
                                                slug: slugTouched.current
                                                    ? current.slug
                                                    : toSlug(title),
                                            }));
                                        }}
                                    />
                                </Field>

                                <Field
                                    label="Page address"
                                    htmlFor={slugId}
                                    error={fieldErrors.slug}
                                    hint="What comes after /blog/ in the link. Lowercase letters, numbers and hyphens."
                                >
                                    <Input
                                        id={slugId}
                                        value={form.slug}
                                        disabled={isSaving}
                                        aria-invalid={Boolean(fieldErrors.slug)}
                                        onChange={(event) => {
                                            slugTouched.current = true;
                                            change('slug', event.target.value);
                                        }}
                                    />
                                </Field>
                            </FormGrid>

                            <Field
                                label="Short description"
                                htmlFor={excerptId}
                                error={fieldErrors.excerpt}
                                hint="Quoted on the journal listing, and in search results when nothing better is written."
                            >
                                <Textarea
                                    id={excerptId}
                                    value={form.excerpt}
                                    disabled={isSaving}
                                    aria-invalid={Boolean(fieldErrors.excerpt)}
                                    onChange={(event) => change('excerpt', event.target.value)}
                                />
                            </Field>
                        </FormSection>

                        <FormSection title="Content" description="The post itself.">
                            <ContentEditor
                                id={contentId}
                                value={form.content}
                                disabled={isSaving}
                                error={fieldErrors.content}
                                onChange={(value) => change('content', value)}
                            />
                        </FormSection>

                        <FormSection
                            title="Featured image"
                            description="Shown at the top of the post and beside it on the listing."
                        >
                            <FileUploadField
                                id={imageId}
                                label="Image"
                                kind="image"
                                file={file}
                                onFileChange={setFile}
                                existingUrl={existing?.image_url ?? null}
                                existingCaption="On the post now"
                                hint={`JPG, PNG or WebP, up to 10 MB.${existing ? ' Leave empty to keep the current picture.' : ''}`}
                                error={fieldErrors.image_file}
                                disabled={isSaving}
                            />
                        </FormSection>

                        <FormSection
                            title="How it is found"
                            description="What appears when this post is shared, or comes up in a search."
                        >
                            <FormGrid>
                                <Field
                                    label="Meta title"
                                    htmlFor={metaTitleId}
                                    error={fieldErrors.meta_title}
                                    hint="Leave empty to use the post's own title."
                                >
                                    <Input
                                        id={metaTitleId}
                                        value={form.meta_title}
                                        disabled={isSaving}
                                        aria-invalid={Boolean(fieldErrors.meta_title)}
                                        onChange={(event) =>
                                            change('meta_title', event.target.value)
                                        }
                                    />
                                </Field>

                                <Field
                                    label="Canonical URL"
                                    htmlFor={canonicalId}
                                    error={fieldErrors.canonical_url}
                                    hint="Only needed when this post also appears somewhere else."
                                >
                                    <Input
                                        id={canonicalId}
                                        type="url"
                                        value={form.canonical_url}
                                        disabled={isSaving}
                                        aria-invalid={Boolean(fieldErrors.canonical_url)}
                                        onChange={(event) =>
                                            change('canonical_url', event.target.value)
                                        }
                                    />
                                </Field>
                            </FormGrid>

                            <Field
                                label="Meta description"
                                htmlFor={metaDescriptionId}
                                error={fieldErrors.meta_description}
                                hint="Leave empty to use the short description."
                            >
                                <Textarea
                                    id={metaDescriptionId}
                                    value={form.meta_description}
                                    disabled={isSaving}
                                    aria-invalid={Boolean(fieldErrors.meta_description)}
                                    onChange={(event) =>
                                        change('meta_description', event.target.value)
                                    }
                                />
                            </Field>
                        </FormSection>
                    </>
                }
                aside={
                    <>
                        <FormSection
                            title="Publishing"
                            description="Whether readers can see this, and when."
                        >
                            <Field
                                label="Status"
                                htmlFor={statusId}
                                error={fieldErrors.status}
                                required
                            >
                                <SelectField
                                    id={statusId}
                                    value={form.status}
                                    disabled={isSaving}
                                    invalid={Boolean(fieldErrors.status)}
                                    options={choices.statuses.map((status) => ({
                                        value: status.value,
                                        label: status.label,
                                        description: status.description,
                                    }))}
                                    onChange={(value) => change('status', value as PostStatus)}
                                />
                            </Field>

                            <Field
                                label="Published date"
                                htmlFor={publishedAtId}
                                error={fieldErrors.published_at}
                                hint="Leave empty to publish as soon as you save. A future date schedules it."
                            >
                                <Input
                                    id={publishedAtId}
                                    type="datetime-local"
                                    value={form.published_at}
                                    disabled={isSaving}
                                    aria-invalid={Boolean(fieldErrors.published_at)}
                                    onChange={(event) => change('published_at', event.target.value)}
                                />
                            </Field>

                            <ToggleField
                                id={featuredId}
                                label="Featured"
                                description="Featured posts are the ones chosen for the homepage."
                                checked={form.is_featured}
                                disabled={isSaving}
                                onChange={(checked) => change('is_featured', checked)}
                            />

                            <AdvancedSettings forceOpen={Boolean(fieldErrors.display_order)}>
                                <Field
                                    label="Display order"
                                    htmlFor={orderId}
                                    error={fieldErrors.display_order}
                                    hint="Lower numbers appear first where posts are ordered by hand."
                                    className="max-w-40"
                                >
                                    <Input
                                        id={orderId}
                                        type="number"
                                        min={0}
                                        value={form.display_order}
                                        disabled={isSaving}
                                        aria-invalid={Boolean(fieldErrors.display_order)}
                                        onChange={(event) =>
                                            change('display_order', Number(event.target.value) || 0)
                                        }
                                    />
                                </Field>
                            </AdvancedSettings>
                        </FormSection>

                        <FormSection
                            title="Filing"
                            description="How this post is grouped, and who wrote it."
                        >
                            <Field
                                label="Category"
                                htmlFor={categoryId}
                                error={fieldErrors.category}
                                hint="Type a new one, or reuse one already in the journal."
                            >
                                <Input
                                    id={categoryId}
                                    list={`${categoryId}-known`}
                                    value={form.category}
                                    disabled={isSaving}
                                    aria-invalid={Boolean(fieldErrors.category)}
                                    onChange={(event) => change('category', event.target.value)}
                                />
                                {/* The categories already in use, offered rather than
                            imposed — a journal this size does not need a second
                            module to manage a dozen words. */}
                                <datalist id={`${categoryId}-known`}>
                                    {choices.categories.map((category) => (
                                        <option key={category} value={category} />
                                    ))}
                                </datalist>
                            </Field>

                            <Field
                                label="Filed by"
                                htmlFor={authorId}
                                error={fieldErrors.author_id}
                                hint="The member of staff who published it. Never shown to readers."
                            >
                                <SelectField
                                    id={authorId}
                                    value={form.author_id}
                                    disabled={isSaving}
                                    invalid={Boolean(fieldErrors.author_id)}
                                    options={[
                                        { value: '', label: 'No author' },
                                        ...choices.authors.map((author) => ({
                                            value: String(author.id),
                                            label: author.name,
                                        })),
                                    ]}
                                    onChange={(value) => change('author_id', value)}
                                />
                            </Field>

                            {/* Most of this journal is written by members of the club, and a
                    member has no account here — so the byline is a name typed in
                    rather than an account chosen from a list. */}
                            <Field
                                label="Written by"
                                htmlFor={writerId}
                                error={fieldErrors.author_name}
                                hint="The name readers see under the title. Leave empty for a post the team wrote."
                            >
                                <Input
                                    id={writerId}
                                    value={form.author_name}
                                    disabled={isSaving}
                                    placeholder="Chitra Warrier"
                                    aria-invalid={Boolean(fieldErrors.author_name)}
                                    onChange={(event) => change('author_name', event.target.value)}
                                />
                            </Field>

                            <TagInput
                                id={tagsId}
                                value={form.tags}
                                disabled={isSaving}
                                error={fieldErrors.tags}
                                onChange={(tags) => change('tags', tags)}
                            />
                        </FormSection>
                    </>
                }
            />

            <FormActions
                cancelHref={paths.admin.blog}
                submitLabel={submitLabel}
                isSaving={isSaving}
            />
        </form>
    );
}
