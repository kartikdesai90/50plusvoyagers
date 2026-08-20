'use client';

import { useCallback, useEffect, useState } from 'react';

import { FormPage, FormSkeleton, LoadFailure } from '@/admin/components/form-page';
import { FormTabs } from '@/admin/components/form-tabs';
import { MetaBadge } from '@/admin/components/meta-badge';
import { toInput as toCardInput } from '@/admin/features/who-we-are/defaults';
import { WhoWeAreForm } from '@/admin/features/who-we-are/who-we-are-form';
import { getWhoWeAreCards, saveWhoWeAreCards } from '@/admin/features/who-we-are/who-we-are-api';
import type { CardInput, WhoWeAreCard } from '@/admin/features/who-we-are/types';
import { toInput as toWhyInput } from '@/admin/features/why-us/defaults';
import { WhyUsForm } from '@/admin/features/why-us/why-us-form';
import { getWhyUs, saveWhyUs } from '@/admin/features/why-us/why-us-api';
import type { WhyUsFiles, WhyUsInput, WhyUsSection } from '@/admin/features/why-us/types';
import { paths } from '@/routes/paths';
import { normalizeError } from '@/shared/lib/api-error';

/**
 * The two homepage bands whose content an editor maintains.
 *
 * One screen with two tabs rather than two entries in the sidebar. They are two
 * bands of one page and are looked after in one sitting — but each is its own
 * form with its own save, because saving the cards has nothing to do with
 * saving the band beneath them, and a single button over both would make every
 * change to one a rewrite of the other.
 *
 * What is deliberately not here is either band's heading or the small line over
 * it. Those title the sections rather than saying anything that changes, so
 * they stay in the components that draw them.
 *
 * Both sets are fetched at once, on opening: the tabs are two views of one
 * screen, and a tab that loaded when it was first clicked would be a screen
 * that is only half ready however long you have been looking at it.
 */
export default function AdminHomeSectionsPage() {
    const [cards, setCards] = useState<WhoWeAreCard[] | null>(null);
    const [band, setBand] = useState<WhyUsSection | null>(null);

    const [isLoading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /* Kept apart per tab. A 422 on the cards must not put a message under the
       band's fields, and a notice about one must not look like news about both. */
    const [savingCards, setSavingCards] = useState(false);
    const [savingBand, setSavingBand] = useState(false);
    const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
    const [bandErrors, setBandErrors] = useState<Record<string, string>>({});
    const [notice, setNotice] = useState<string | null>(null);

    const load = useCallback(
        () =>
            Promise.all([getWhoWeAreCards(), getWhyUs()])
                .then(([foundCards, foundBand]) => {
                    setError(null);
                    setCards(foundCards);
                    setBand(foundBand);
                })
                .catch((problem) => setError(normalizeError(problem).message))
                .finally(() => setLoading(false)),
        [],
    );

    useEffect(() => {
        void load();
    }, [load]);

    const saveCards = async (input: CardInput[]) => {
        setSavingCards(true);
        setError(null);
        setNotice(null);
        setCardErrors({});

        try {
            setCards(await saveWhoWeAreCards(input));
            setNotice('The cards have been saved.');
        } catch (problem) {
            const normalized = normalizeError(problem);
            setError(normalized.message);
            setCardErrors(normalized.fieldErrors);
        } finally {
            setSavingCards(false);
        }
    };

    const saveBand = async (input: WhyUsInput, files: WhyUsFiles) => {
        setSavingBand(true);
        setError(null);
        setNotice(null);
        setBandErrors({});

        try {
            setBand(await saveWhyUs(input, files));
            setNotice('The band has been saved.');
        } catch (problem) {
            const normalized = normalizeError(problem);
            setError(normalized.message);
            setBandErrors(normalized.fieldErrors);
        } finally {
            setSavingBand(false);
        }
    };

    const isReady = cards !== null && band !== null;

    return (
        <FormPage
            breadcrumbs={[
                { label: 'Dashboard', href: paths.admin.dashboard },
                { label: 'Home sections' },
            ]}
            title="Home sections"
            description="The two bands in the middle of the homepage: the cards under “Who we are”, and the points and photograph under “Why travel with us”."
            error={isReady ? error : null}
            meta={
                isReady ? (
                    <>
                        {band.updated_at ? (
                            <MetaBadge>
                                Last saved{' '}
                                {new Date(band.updated_at).toLocaleDateString(undefined, {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </MetaBadge>
                        ) : (
                            /* Until it is saved the homepage draws what the
                               design shipped with, which is worth saying rather
                               than leaving an editor to wonder. */
                            <MetaBadge tone="muted">Band not written yet</MetaBadge>
                        )}
                        {notice ? <MetaBadge tone="active">{notice}</MetaBadge> : null}
                    </>
                ) : null
            }
        >
            {isLoading ? (
                <FormSkeleton />
            ) : isReady ? (
                <FormTabs
                    tabs={[
                        {
                            id: 'who-we-are',
                            label: 'Who we are',
                            description:
                                'The cards across the band. Their order here is their order on the page.',
                            panel: (
                                <WhoWeAreForm
                                    /* Remounts on a save so the chosen files go
                                       back to showing what is now stored. */
                                    key={cards.map((card) => card.id).join('-') || 'empty'}
                                    initial={toCardInput(cards)}
                                    isSaving={savingCards}
                                    fieldErrors={cardErrors}
                                    onSubmit={(input) => void saveCards(input)}
                                />
                            ),
                        },
                        {
                            id: 'why-travel-with-us',
                            label: 'Why travel with us',
                            description:
                                'The ticked points, the photograph beside them, and the words printed over it.',
                            panel: (
                                <WhyUsForm
                                    key={band.updated_at ?? 'new'}
                                    initial={toWhyInput(band)}
                                    existing={band}
                                    isSaving={savingBand}
                                    fieldErrors={bandErrors}
                                    onSubmit={(input, files) => void saveBand(input, files)}
                                />
                            ),
                        },
                    ]}
                />
            ) : (
                <LoadFailure
                    message={error ?? 'These sections could not be loaded.'}
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
