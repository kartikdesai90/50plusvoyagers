'use client';

import { useCallback, useEffect, useState } from 'react';

import { FormPage, FormSkeleton, LoadFailure } from '@/admin/components/form-page';
import { MetaBadge } from '@/admin/components/meta-badge';
import { toInput } from '@/admin/features/settings/defaults';
import { getSettings, saveSettings } from '@/admin/features/settings/settings-api';
import { SettingsForm } from '@/admin/features/settings/settings-form';
import type { SettingsFiles, SettingsInput, SiteSettings } from '@/admin/features/settings/types';
import { paths } from '@/routes/paths';
import { normalizeError } from '@/shared/lib/api-error';

/**
 * The site's settings.
 *
 * One screen, not the three every other module has. There is one set of
 * settings, so there is nothing to list, nothing to create and nothing to
 * delete — an editor opens them, changes what has changed, and saves.
 *
 * Which is also why saving stays here rather than navigating away with a notice
 * the way the other modules do. There is no list to go back to, and being
 * returned to the dashboard after correcting a telephone number would take an
 * editor further from the next thing they wanted to change, not closer.
 */
export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<SiteSettings | null>(null);

    const [isLoading, setLoading] = useState(true);
    const [isSaving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const load = useCallback(
        () =>
            getSettings()
                .then((found) => {
                    setError(null);
                    setSettings(found);
                })
                .catch((problem) => setError(normalizeError(problem).message))
                .finally(() => setLoading(false)),
        [],
    );

    useEffect(() => {
        void load();
    }, [load]);

    const save = async (input: SettingsInput, files: SettingsFiles) => {
        setSaving(true);
        setError(null);
        setNotice(null);
        setFieldErrors({});

        try {
            const saved = await saveSettings(input, files);

            /*
             * Replacing the record is what clears the chosen files: the form
             * remounts on the new `key`, so the upload fields go back to
             * showing what is stored rather than what was just sent.
             */
            setSettings(saved);
            setNotice('Your settings have been saved.');
        } catch (problem) {
            const normalized = normalizeError(problem);
            setError(normalized.message);
            setFieldErrors(normalized.fieldErrors);
        } finally {
            setSaving(false);
        }
    };

    return (
        <FormPage
            breadcrumbs={[
                { label: 'Dashboard', href: paths.admin.dashboard },
                { label: 'Settings' },
            ]}
            title="Settings"
            description="What is true on every page of the site: how to reach you, where to find you, and what a search engine is told."
            error={settings ? error : null}
            meta={
                settings ? (
                    <>
                        {settings.updated_at ? (
                            <MetaBadge>
                                Last saved{' '}
                                {new Date(settings.updated_at).toLocaleDateString(undefined, {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </MetaBadge>
                        ) : (
                            <MetaBadge tone="muted">Never saved</MetaBadge>
                        )}
                        {notice ? <MetaBadge tone="active">{notice}</MetaBadge> : null}
                    </>
                ) : null
            }
        >
            {isLoading ? (
                <FormSkeleton />
            ) : settings ? (
                <SettingsForm
                    key={settings.updated_at ?? 'new'}
                    initial={toInput(settings)}
                    existing={settings}
                    isSaving={isSaving}
                    fieldErrors={fieldErrors}
                    onSubmit={(input, files) => void save(input, files)}
                />
            ) : (
                <LoadFailure
                    message={error ?? 'The settings could not be loaded.'}
                    backHref={paths.admin.dashboard}
                    backLabel="Back to Dashboard"
                    onRetry={() => {
                        setLoading(true);
                        void load();
                    }}
                />
            )}
        </FormPage>
    );
}
