import { useId, useState } from 'react';

import { AdvancedSettings } from '@/admin/components/advanced-settings';
import { FileUploadField } from '@/admin/components/file-upload-field';
import { FormActions } from '@/admin/components/form-actions';
import { Field, FormLayout, FormSection } from '@/admin/components/form-section';
import { formatEndDate, formatRupees } from '@/admin/features/tours/defaults';
import type { TourFiles } from '@/admin/features/tours/tours-api';
import type { Tour, TourInput } from '@/admin/features/tours/types';
import { paths } from '@/routes/paths';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

type TourFormProps = {
    initial: TourInput;
    /** What is already stored, on the edit screen. */
    existing?: Tour | null;
    isSaving: boolean;
    /** Keyed by the server's field names, so a 422 lands on the field at fault. */
    fieldErrors: Record<string, string>;
    submitLabel: string;
    onSubmit: (input: TourInput, files: TourFiles) => void;
};

/**
 * The tour form, shared by adding a tour and changing one.
 *
 * Two columns, like every other module: the substance on the left, and on the
 * right the decisions about where this sits and who can see it.
 *
 * The left column is ordered the way the page reads rather than the way the
 * table is defined — what the CRM calls it, then what the page says, then the
 * booking terms. The meta tags sit behind Advanced: they are carried across
 * verbatim from the old site and most editors should never need to touch them,
 * but they must be reachable, because preserving them is the whole SEO
 * requirement.
 *
 * The repeating content — the itinerary, the highlights, the inclusions, the
 * carousel — is not here. Those are lists with their own rows, and a form that
 * edited thirteen days inline would be a form nobody could scan. They are
 * imported by `php artisan tour:import` today and get their own screens next.
 */
export function TourForm({
    initial,
    existing = null,
    isSaving,
    fieldErrors,
    submitLabel,
    onSubmit,
}: TourFormProps) {
    const [form, setForm] = useState<TourInput>(initial);
    const [mainImage, setMainImage] = useState<File | null>(null);
    const [routeMap, setRouteMap] = useState<File | null>(null);
    const [ogImage, setOgImage] = useState<File | null>(null);

    const codeId = useId();
    const nameId = useId();
    const slugId = useId();
    const pageTitleId = useId();
    const subtitleId = useId();
    const summaryId = useId();
    const ribbonId = useId();
    const visaId = useId();
    const mainImageId = useId();
    const routeMapId = useId();
    const ogImageId = useId();
    const orderId = useId();
    const metaTitleId = useId();
    const metaDescriptionId = useId();
    const metaKeywordsId = useId();
    const ogTitleId = useId();
    const ogDescriptionId = useId();
    const canonicalId = useId();

    const change = <FieldName extends keyof TourInput>(field: FieldName, value: string) =>
        setForm((current) => ({ ...current, [field]: value }));

    return (
        <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
                event.preventDefault();
                if (!isSaving) {
                    onSubmit(form, {
                        image_file: mainImage,
                        route_map_file: routeMap,
                        og_image_file: ogImage,
                    });
                }
            }}
            noValidate
        >
            <FormLayout
                main={
                    <>
                        <FormSection
                            title="In the CRM"
                            description="The code joins this page to tb_group_tour. Dates, price and category are read from there — they are not edited here."
                        >
                            <Field
                                label="Tour code"
                                htmlFor={codeId}
                                required
                                error={fieldErrors.tour_code}
                                hint="e.g. Coorg30052026. No two tours share one."
                            >
                                <Input
                                    id={codeId}
                                    value={form.tour_code}
                                    maxLength={50}
                                    placeholder="Coorg30052026"
                                    autoComplete="off"
                                    onChange={(event) =>
                                        change('tour_code', event.target.value)
                                    }
                                />
                            </Field>

                            <Field
                                label="Tour name"
                                htmlFor={nameId}
                                required
                                error={fieldErrors.tour_name}
                                hint="The CRM's name for the departure, e.g. Coorg 30 May - 2 June 2026."
                            >
                                <Input
                                    id={nameId}
                                    value={form.tour_name}
                                    maxLength={200}
                                    placeholder="Coorg 30 May - 2 June 2026"
                                    onChange={(event) => change('tour_name', event.target.value)}
                                />
                            </Field>

                            <CrmSnapshot tour={existing} />
                        </FormSection>

                        <FormSection
                            title="The page"
                            description="What a visitor reads. The price, dates and duration are not here — those are read live from the CRM."
                        >
                            <Field
                                label="Address"
                                htmlFor={slugId}
                                error={fieldErrors.slug}
                                hint="The last part of the web address, e.g. spain-portugal. Keep the old page's name so existing links and search rankings survive."
                            >
                                <Input
                                    id={slugId}
                                    value={form.slug}
                                    maxLength={160}
                                    placeholder="spain-portugal"
                                    autoComplete="off"
                                    onChange={(event) => change('slug', event.target.value)}
                                />
                            </Field>

                            <Field
                                label="Heading"
                                htmlFor={pageTitleId}
                                error={fieldErrors.page_title}
                                hint="The big title on the page. Different from the CRM name — a place rather than a departure, e.g. Coorg - The Coffee Capital of India."
                            >
                                <Input
                                    id={pageTitleId}
                                    value={form.page_title}
                                    maxLength={255}
                                    placeholder="Coorg - The Coffee Capital of India"
                                    onChange={(event) => change('page_title', event.target.value)}
                                />
                            </Field>

                            <Field
                                label="Places line"
                                htmlFor={subtitleId}
                                error={fieldErrors.subtitle}
                                hint="The line of destinations under the heading."
                            >
                                <Input
                                    id={subtitleId}
                                    value={form.subtitle}
                                    maxLength={255}
                                    placeholder="Namdroling ● Madikeri ● Tala Kaveri"
                                    onChange={(event) => change('subtitle', event.target.value)}
                                />
                            </Field>

                            <Field
                                label="Opening prose"
                                htmlFor={summaryId}
                                error={fieldErrors.summary}
                                hint="The paragraphs under the heading, before the highlights."
                            >
                                <Textarea
                                    id={summaryId}
                                    value={form.summary}
                                    rows={6}
                                    onChange={(event) => change('summary', event.target.value)}
                                />
                            </Field>

                            <Field
                                label="Ribbon"
                                htmlFor={ribbonId}
                                error={fieldErrors.ribbon_text}
                                hint="The small badge over the photograph."
                            >
                                <Input
                                    id={ribbonId}
                                    value={form.ribbon_text}
                                    maxLength={80}
                                    placeholder="Stay in Coffee Estate"
                                    onChange={(event) =>
                                        change('ribbon_text', event.target.value)
                                    }
                                />
                            </Field>

                            <Field
                                label="Visa note"
                                htmlFor={visaId}
                                error={fieldErrors.visa_content}
                                hint="Shown as its own section. Leave empty on a domestic tour."
                            >
                                <Textarea
                                    id={visaId}
                                    value={form.visa_content}
                                    rows={4}
                                    onChange={(event) => change('visa_content', event.target.value)}
                                />
                            </Field>
                        </FormSection>

                        <FormSection
                            title="Pictures"
                            description="The main photograph, the route map shown on the page, and the image social networks use when the page is shared."
                        >
                            <FileUploadField
                                id={mainImageId}
                                label="Main image"
                                kind="image"
                                file={mainImage}
                                onFileChange={setMainImage}
                                existingUrl={existing?.image_url ?? null}
                                error={fieldErrors.image_file}
                                hint="The photograph this tour leads with, on its card and at the top of its page. Leave empty to use the cover photograph filed under this tour in the Gallery."
                            />

                            <FileUploadField
                                id={routeMapId}
                                label="Route map"
                                kind="image"
                                file={routeMap}
                                onFileChange={setRouteMap}
                                existingUrl={existing?.route_map_url ?? null}
                                error={fieldErrors.route_map_file}
                                hint="The map of the journey, shown as its own section."
                            />

                            <FileUploadField
                                id={ogImageId}
                                label="Share image"
                                kind="image"
                                file={ogImage}
                                onFileChange={setOgImage}
                                existingUrl={existing?.og_image_url ?? null}
                                error={fieldErrors.og_image_file}
                                hint="Used when the page is shared on social networks."
                            />
                        </FormSection>

                        {/*
                         * Carried across verbatim from the old pages. Behind
                         * Advanced because most editors should never touch
                         * them — but reachable, because preserving them
                         * exactly is the whole SEO requirement.
                         */}
                        <AdvancedSettings>
                            <Field
                                label="Search title"
                                htmlFor={metaTitleId}
                                error={fieldErrors.meta_title}
                                hint="Carried across from the old page. Leave as it is unless you have a reason — this is what the page ranks on."
                            >
                                <Input
                                    id={metaTitleId}
                                    value={form.meta_title}
                                    maxLength={255}
                                    onChange={(event) => change('meta_title', event.target.value)}
                                />
                            </Field>

                            <Field
                                label="Search description"
                                htmlFor={metaDescriptionId}
                                error={fieldErrors.meta_description}
                            >
                                <Textarea
                                    id={metaDescriptionId}
                                    value={form.meta_description}
                                    rows={3}
                                    maxLength={500}
                                    onChange={(event) =>
                                        change('meta_description', event.target.value)
                                    }
                                />
                            </Field>

                            <Field
                                label="Keywords"
                                htmlFor={metaKeywordsId}
                                error={fieldErrors.meta_keywords}
                                hint="Kept as the old pages had them."
                            >
                                <Input
                                    id={metaKeywordsId}
                                    value={form.meta_keywords}
                                    maxLength={500}
                                    onChange={(event) =>
                                        change('meta_keywords', event.target.value)
                                    }
                                />
                            </Field>

                            <Field
                                label="Share title"
                                htmlFor={ogTitleId}
                                error={fieldErrors.og_title}
                                hint="Used when the page is shared on social networks."
                            >
                                <Input
                                    id={ogTitleId}
                                    value={form.og_title}
                                    maxLength={255}
                                    onChange={(event) => change('og_title', event.target.value)}
                                />
                            </Field>

                            <Field
                                label="Share description"
                                htmlFor={ogDescriptionId}
                                error={fieldErrors.og_description}
                            >
                                <Textarea
                                    id={ogDescriptionId}
                                    value={form.og_description}
                                    rows={3}
                                    maxLength={500}
                                    onChange={(event) =>
                                        change('og_description', event.target.value)
                                    }
                                />
                            </Field>

                            <Field
                                label="Canonical address"
                                htmlFor={canonicalId}
                                error={fieldErrors.canonical_url}
                                hint="Only if this page duplicates another. Usually empty."
                            >
                                <Input
                                    id={canonicalId}
                                    value={form.canonical_url}
                                    maxLength={2048}
                                    onChange={(event) =>
                                        change('canonical_url', event.target.value)
                                    }
                                />
                            </Field>

                        </AdvancedSettings>
                    </>
                }
                aside={
                    <FormSection
                        title="Visibility"
                        description="The site shows a tour once it has an address. Live vs hidden is tour_status on tb_group_tour, not a second flag here."
                    >
                        <Field
                            label="Order"
                            htmlFor={orderId}
                            error={fieldErrors.display_order}
                            hint="Lower numbers come first."
                        >
                            <Input
                                id={orderId}
                                type="number"
                                min={0}
                                value={form.display_order}
                                onChange={(event) => change('display_order', event.target.value)}
                            />
                        </Field>

                        {existing ? (
                            <p className="text-xs/[1.6] text-muted-foreground">
                                The itinerary, highlights and what the price covers are written
                                under <span className="font-medium">Page content</span>, and saved
                                separately. The photographs are filed in the Gallery against this
                                tour.
                            </p>
                        ) : null}
                    </FormSection>
                }
            />

            <FormActions
                cancelHref={paths.admin.tours}
                submitLabel={submitLabel}
                isSaving={isSaving}
            />
        </form>
    );
}

function CrmSnapshot({ tour }: { tour?: Tour | null }) {
    if (!tour) {
        return (
            <p className="text-xs/[1.6] text-muted-foreground">
                Save this tour, then dates, package cost, deposit and category appear here from
                tb_group_tour. They cannot be edited on this page.
            </p>
        );
    }

    const crm = tour.crm;

    if (!crm) {
        return (
            <p className="text-xs/[1.6] text-muted-foreground">
                No upcoming CRM departure matches this tour code yet. Package cost, dates and
                category will appear here once tb_group_tour has a live row.
            </p>
        );
    }

    const facts = [
        ['Departs', formatEndDate(crm.starts_on)],
        ['Ends', formatEndDate(crm.ends_on)],
        [
            'Duration',
            crm.nights != null ? `${crm.nights + 1} days / ${crm.nights} nights` : '—',
        ],
        ['Package cost', formatRupees(crm.price)],
        ['Advance', formatRupees(crm.advance)],
        ['Category', crm.category ?? '—'],
        ['CRM status', crm.status ?? '—'],
        ['Booking', crm.booking_open === null ? '—' : crm.booking_open ? 'Open' : 'Closed'],
    ];

    return (
        <dl className="grid gap-3 sm:grid-cols-2">
            {facts.map(([label, value]) => (
                <div key={label}>
                    <dt className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                        {label}
                    </dt>
                    <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
                </div>
            ))}
            {crm.website_link ? (
                <div className="sm:col-span-2">
                    <dt className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                        CRM website link
                    </dt>
                    <dd className="mt-0.5 break-all text-sm text-foreground">{crm.website_link}</dd>
                </div>
            ) : null}
        </dl>
    );
}
