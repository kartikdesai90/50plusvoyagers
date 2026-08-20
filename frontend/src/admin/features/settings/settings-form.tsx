import { Globe, Mail, MapPin, Phone, Search, Smartphone } from 'lucide-react';
import { useId, useState } from 'react';

import { FileUploadField } from '@/admin/components/file-upload-field';
import { FormActions } from '@/admin/components/form-actions';
import { Field, FormGrid, FormLayout, FormSection } from '@/admin/components/form-section';
import { IconInput } from '@/admin/components/icon-input';
import { LinkListField } from '@/admin/components/link-list-field';
import { noFiles } from '@/admin/features/settings/defaults';
import type { SettingsFiles, SettingsInput, SiteSettings } from '@/admin/features/settings/types';
import { paths } from '@/routes/paths';
import {
    FacebookIcon,
    InstagramIcon,
    LinkedInIcon,
    WhatsAppIcon,
    XIcon,
    YouTubeIcon,
} from '@/shared/ui/brand-icons';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

type SettingsFormProps = {
    initial: SettingsInput;
    /** What is already stored, so the pictures can be shown as they are. */
    existing: SiteSettings;
    isSaving: boolean;
    /** Keyed by the server's field names, so a 422 lands on the field at fault. */
    fieldErrors: Record<string, string>;
    onSubmit: (input: SettingsInput, files: SettingsFiles) => void;
};

/**
 * The five social networks the design draws a mark for, in the order the footer
 * shows them. Anything else a business is on goes in the list underneath.
 */
const SOCIALS = [
    { field: 'instagram_url', label: 'Instagram', icon: InstagramIcon },
    { field: 'facebook_url', label: 'Facebook', icon: FacebookIcon },
    { field: 'youtube_url', label: 'YouTube', icon: YouTubeIcon },
    { field: 'linkedin_url', label: 'LinkedIn', icon: LinkedInIcon },
    { field: 'twitter_url', label: 'X', icon: XIcon },
] as const;

/**
 * Everything about the site that is true on every page of it.
 *
 * The wide column is what the business is and how to reach it — the details a
 * visitor came looking for, and the accounts they might follow. The narrow one
 * is what the site is made of: its logo, its favicon, what a search engine is
 * told, and what the footer says underneath everything.
 *
 * One screen, not a create and an edit. There is one set of settings; an
 * editor opens them, changes what has changed, and saves. Everything else about
 * the screen — the sections, the pairing, the sticky save bar — is the shape
 * every other module uses, so this is not a new thing to learn.
 */
export function SettingsForm({
    initial,
    existing,
    isSaving,
    fieldErrors,
    onSubmit,
}: SettingsFormProps) {
    const [form, setForm] = useState<SettingsInput>(initial);
    const [files, setFiles] = useState<SettingsFiles>(noFiles);

    const nameId = useId();
    const emailId = useId();
    const phoneId = useId();
    const phoneAltId = useId();
    const whatsappId = useId();
    const addressId = useId();
    const mapId = useId();
    const socialIds = useId();
    const logoAltId = useId();
    const websiteId = useId();
    const metaTitleId = useId();
    const metaDescriptionId = useId();
    const keywordsId = useId();
    const copyrightId = useId();
    const footerAboutId = useId();

    const change = <FieldName extends keyof SettingsInput>(
        field: FieldName,
        value: SettingsInput[FieldName],
    ) => setForm((current) => ({ ...current, [field]: value }));

    const changeFile = (slot: keyof SettingsFiles, file: File | null) =>
        setFiles((current) => ({ ...current, [slot]: file }));

    return (
        <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
                event.preventDefault();
                if (!isSaving) onSubmit(form, files);
            }}
            noValidate
        >
            <FormLayout
                main={
                    <>
                        <FormSection
                            title="Contact information"
                            description="What the business is called, and every way a traveller can reach it."
                        >
                            <Field
                                label="Website name"
                                htmlFor={nameId}
                                error={fieldErrors.company_name}
                                required
                                hint="Used in the footer, in search results and when a page is shared."
                            >
                                <Input
                                    id={nameId}
                                    value={form.company_name}
                                    disabled={isSaving}
                                    aria-invalid={Boolean(fieldErrors.company_name)}
                                    onChange={(event) => change('company_name', event.target.value)}
                                />
                            </Field>

                            <FormGrid>
                                <Field label="Email" htmlFor={emailId} error={fieldErrors.email}>
                                    <IconInput
                                        icon={Mail}
                                        id={emailId}
                                        type="email"
                                        inputMode="email"
                                        autoComplete="email"
                                        placeholder="info@example.com"
                                        value={form.email}
                                        disabled={isSaving}
                                        aria-invalid={Boolean(fieldErrors.email)}
                                        onChange={(event) => change('email', event.target.value)}
                                    />
                                </Field>

                                <Field
                                    label="WhatsApp number"
                                    htmlFor={whatsappId}
                                    error={fieldErrors.whatsapp_number}
                                    /* The chat address is built from the digits, so an
                                       editor cannot paste one that is subtly wrong. */
                                    hint={
                                        existing.whatsapp_href
                                            ? `Chats open at ${existing.whatsapp_href}`
                                            : 'The number, not a wa.me link — the link is built from it.'
                                    }
                                >
                                    <IconInput
                                        icon={WhatsAppIcon}
                                        id={whatsappId}
                                        type="tel"
                                        inputMode="tel"
                                        placeholder="+91 80957 73222"
                                        value={form.whatsapp_number}
                                        disabled={isSaving}
                                        aria-invalid={Boolean(fieldErrors.whatsapp_number)}
                                        onChange={(event) =>
                                            change('whatsapp_number', event.target.value)
                                        }
                                    />
                                </Field>

                                <Field label="Phone" htmlFor={phoneId} error={fieldErrors.phone}>
                                    <IconInput
                                        icon={Phone}
                                        id={phoneId}
                                        type="tel"
                                        inputMode="tel"
                                        autoComplete="tel"
                                        placeholder="+91 80957 73222"
                                        value={form.phone}
                                        disabled={isSaving}
                                        aria-invalid={Boolean(fieldErrors.phone)}
                                        onChange={(event) => change('phone', event.target.value)}
                                    />
                                </Field>

                                <Field
                                    label="Second phone"
                                    htmlFor={phoneAltId}
                                    error={fieldErrors.phone_alt}
                                    hint="Optional. Shown alongside the first."
                                >
                                    <IconInput
                                        icon={Smartphone}
                                        id={phoneAltId}
                                        type="tel"
                                        inputMode="tel"
                                        placeholder="+91 74065 77905"
                                        value={form.phone_alt}
                                        disabled={isSaving}
                                        aria-invalid={Boolean(fieldErrors.phone_alt)}
                                        onChange={(event) =>
                                            change('phone_alt', event.target.value)
                                        }
                                    />
                                </Field>
                            </FormGrid>

                            <Field
                                label="Address"
                                htmlFor={addressId}
                                error={fieldErrors.address}
                                hint="Shown in the footer, as you would write it on an envelope."
                            >
                                <Textarea
                                    id={addressId}
                                    value={form.address}
                                    disabled={isSaving}
                                    aria-invalid={Boolean(fieldErrors.address)}
                                    onChange={(event) => change('address', event.target.value)}
                                />
                            </Field>

                            <Field
                                label="Map link"
                                htmlFor={mapId}
                                error={fieldErrors.map_url}
                                hint="A Google Maps link to the office. Leave empty for none."
                            >
                                <IconInput
                                    icon={MapPin}
                                    id={mapId}
                                    type="url"
                                    inputMode="url"
                                    placeholder="https://maps.google.com/…"
                                    value={form.map_url}
                                    disabled={isSaving}
                                    aria-invalid={Boolean(fieldErrors.map_url)}
                                    onChange={(event) => change('map_url', event.target.value)}
                                />
                            </Field>
                        </FormSection>

                        <FormSection
                            title="Social media"
                            description="Every profile with an address here gets a mark in the footer. The rest are not drawn."
                        >
                            <FormGrid>
                                {SOCIALS.map(({ field, label, icon }) => (
                                    <Field
                                        key={field}
                                        label={label}
                                        htmlFor={`${socialIds}-${field}`}
                                        error={fieldErrors[field]}
                                    >
                                        <IconInput
                                            icon={icon}
                                            id={`${socialIds}-${field}`}
                                            type="url"
                                            inputMode="url"
                                            placeholder="https://"
                                            value={form[field]}
                                            disabled={isSaving}
                                            aria-invalid={Boolean(fieldErrors[field])}
                                            onChange={(event) => change(field, event.target.value)}
                                        />
                                    </Field>
                                ))}
                            </FormGrid>

                            <LinkListField
                                label="Other profiles"
                                addLabel="Add a profile"
                                hint="Anywhere else the business has an account. Drawn with a plain link mark."
                                value={form.other_socials}
                                disabled={isSaving}
                                error={fieldErrors.other_socials}
                                onChange={(links) => change('other_socials', links)}
                            />
                        </FormSection>

                        <FormSection
                            title="Search engines"
                            description="What a page falls back to when it says nothing of its own."
                        >
                            <FormGrid>
                                <Field
                                    label="Default title"
                                    htmlFor={metaTitleId}
                                    error={fieldErrors.meta_title}
                                >
                                    <IconInput
                                        icon={Search}
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
                                    label="Default keywords"
                                    htmlFor={keywordsId}
                                    error={fieldErrors.meta_keywords}
                                    hint="Separated by commas. Worth little to search engines now, but harmless."
                                >
                                    <Input
                                        id={keywordsId}
                                        value={form.meta_keywords}
                                        disabled={isSaving}
                                        aria-invalid={Boolean(fieldErrors.meta_keywords)}
                                        onChange={(event) =>
                                            change('meta_keywords', event.target.value)
                                        }
                                    />
                                </Field>
                            </FormGrid>

                            <Field
                                label="Default description"
                                htmlFor={metaDescriptionId}
                                error={fieldErrors.meta_description}
                                hint="One sentence. Around 160 characters is what gets shown."
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

                            <FileUploadField
                                id="settings-og-image"
                                label="Sharing image"
                                kind="image"
                                file={files.og_image_file}
                                onFileChange={(file) => changeFile('og_image_file', file)}
                                existingUrl={existing.og_image_url}
                                existingCaption="Shown when a link is shared"
                                hint="What appears when a page is posted somewhere. 1200×630 works best."
                                error={fieldErrors.og_image_file}
                                disabled={isSaving}
                            />
                        </FormSection>
                    </>
                }
                aside={
                    <>
                        <FormSection
                            title="Website"
                            description="What the site is called and what it is marked with."
                        >
                            <FileUploadField
                                id="settings-logo"
                                label="Logo"
                                kind="image"
                                file={files.logo_file}
                                onFileChange={(file) => changeFile('logo_file', file)}
                                existingUrl={existing.logo_url}
                                existingCaption="On the site now"
                                hint="JPG, PNG, WebP or SVG, up to 5 MB."
                                error={fieldErrors.logo_file}
                                disabled={isSaving}
                            />

                            <Field
                                label="Describe the logo"
                                htmlFor={logoAltId}
                                error={fieldErrors.logo_alt}
                                hint="Read aloud to visitors who cannot see it."
                            >
                                <Input
                                    id={logoAltId}
                                    value={form.logo_alt}
                                    disabled={isSaving}
                                    aria-invalid={Boolean(fieldErrors.logo_alt)}
                                    onChange={(event) => change('logo_alt', event.target.value)}
                                />
                            </Field>

                            <FileUploadField
                                id="settings-favicon"
                                label="Favicon"
                                kind="image"
                                file={files.favicon_file}
                                onFileChange={(file) => changeFile('favicon_file', file)}
                                existingUrl={existing.favicon_url}
                                existingCaption="In the browser tab now"
                                hint="PNG, SVG or ICO, up to 512 KB. Square works best."
                                error={fieldErrors.favicon_file}
                                disabled={isSaving}
                                /* A tab icon is wanted as a PNG, an SVG or an
                                   ICO; the endpoint takes no WebP back. */
                                compress={false}
                            />

                            <Field
                                label="Website address"
                                htmlFor={websiteId}
                                error={fieldErrors.website_url}
                                hint="The site's own address, used where a full link is needed."
                            >
                                <IconInput
                                    icon={Globe}
                                    id={websiteId}
                                    type="url"
                                    inputMode="url"
                                    placeholder="https://example.com"
                                    value={form.website_url}
                                    disabled={isSaving}
                                    aria-invalid={Boolean(fieldErrors.website_url)}
                                    onChange={(event) => change('website_url', event.target.value)}
                                />
                            </Field>
                        </FormSection>

                        <FormSection title="Footer" description="The bottom of every page.">
                            <Field
                                label="About line"
                                htmlFor={footerAboutId}
                                error={fieldErrors.footer_description}
                                hint="A sentence about the business, under the wordmark."
                            >
                                <Textarea
                                    id={footerAboutId}
                                    value={form.footer_description}
                                    disabled={isSaving}
                                    aria-invalid={Boolean(fieldErrors.footer_description)}
                                    onChange={(event) =>
                                        change('footer_description', event.target.value)
                                    }
                                />
                            </Field>

                            <Field
                                label="Copyright"
                                htmlFor={copyrightId}
                                error={fieldErrors.copyright_text}
                                /* The year is not stored: one written into a database
                                   is a year that is wrong every January. */
                                hint="The words after the ©. The year is added for you."
                            >
                                <Input
                                    id={copyrightId}
                                    value={form.copyright_text}
                                    disabled={isSaving}
                                    aria-invalid={Boolean(fieldErrors.copyright_text)}
                                    onChange={(event) =>
                                        change('copyright_text', event.target.value)
                                    }
                                />
                            </Field>

                            <LinkListField
                                label="Extra links"
                                addLabel="Add a link"
                                urlPlaceholder="/privacy-policy"
                                hint="Added to the footer's last column. The navigation columns are not editable here."
                                value={form.footer_links}
                                disabled={isSaving}
                                error={fieldErrors.footer_links}
                                onChange={(links) => change('footer_links', links)}
                            />
                        </FormSection>
                    </>
                }
            />

            <FormActions
                cancelHref={paths.admin.dashboard}
                submitLabel="Save settings"
                isSaving={isSaving}
            />
        </form>
    );
}
