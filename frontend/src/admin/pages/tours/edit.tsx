'use client';

import { CheckCircle2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from '@/shared/router';

import { FormPage, FormSkeleton, LoadFailure } from '@/admin/components/form-page';
import { FormTabs } from '@/admin/components/form-tabs';
import { getTourContent, saveTourContent } from '@/admin/features/tours/content-api';
import { emptyContent, toContentInput } from '@/admin/features/tours/content-defaults';
import type { TourContentInput } from '@/admin/features/tours/content-types';
import { toInput } from '@/admin/features/tours/defaults';
import { TourContentForm } from '@/admin/features/tours/tour-content-form';
import { TourForm } from '@/admin/features/tours/tour-form';
import { getTour, updateTour, type TourFiles } from '@/admin/features/tours/tours-api';
import type { Tour, TourInput } from '@/admin/features/tours/types';
import { paths } from '@/routes/paths';
import { normalizeError } from '@/shared/lib/api-error';
import { Alert, AlertDescription } from '@/shared/ui/alert';

/** What a failed save leaves behind, for one tab. */
type Problem = { message: string; fields: Record<string, string> };

const NO_PROBLEM: Problem = { message: '', fields: {} };

/**
 * Changing a tour.
 *
 * Two tabs, because a tour is two things edited in two sittings. The details
 * are what the CRM records and what the page says about itself — a short form,
 * corrected in a moment. The content is the trip: thirteen days, the
 * highlights, what the price covers. Writing that is an afternoon.
 *
 * They save separately for the same reason. One save over both would mean an
 * editor who came to fix a tour code had to post the whole itinerary back to do
 * it, and the server writes only what it is sent — so a screen showing some
 * lists and not others would blank the ones it never displayed.
 *
 * **Each tab keeps its own errors.** They shared one set at first, and that was
 * a real fault rather than untidiness: a rejection from the content save
 * painted a banner over the details form, and the field actually at fault sat
 * on a panel the editor was not looking at. Nothing on screen said which tab to
 * open. Now a failure marks its own tab, brings it to the front, and leaves the
 * other one alone.
 *
 * The content is fetched alongside the tour rather than when its tab is opened.
 * It is one request, it is small, and an editor who clicks Content should find
 * it there rather than watching a second spinner.
 */
export default function AdminTourEditPage() {
    const { tourId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const id = Number(tourId);

    const [tour, setTour] = useState<Tour | null>(null);
    const [content, setContent] = useState<TourContentInput>(emptyContent);

    const [isLoading, setLoading] = useState(true);
    const [isSaving, setSaving] = useState(false);

    /** Fetching the tour failed — which is the whole screen, not one tab. */
    const [loadError, setLoadError] = useState<string | null>(null);

    /*
     * Arriving from the create screen, which sends the editor here rather than
     * to the list: a tour has just been made and its page is still to write.
     */
    const [notice, setNotice] = useState<string | null>(
        (location.state as { notice?: string } | null)?.notice ?? null,
    );

    const [detailsProblem, setDetailsProblem] = useState<Problem>(NO_PROBLEM);
    const [contentProblem, setContentProblem] = useState<Problem>(NO_PROBLEM);

    /* Controlled so a rejected save can bring its own tab to the front. */
    const [tab, setTab] = useState('details');

    const load = useCallback(
        () =>
            Promise.all([getTour(id), getTourContent(id)])
                .then(([found, stored]) => {
                    setLoadError(null);
                    setTour(found);
                    setContent(toContentInput(stored));
                })
                .catch((problem) => setLoadError(normalizeError(problem).message))
                .finally(() => setLoading(false)),
        [id],
    );

    useEffect(() => {
        void load();
    }, [load]);

    /** The details: saved, then back to the list, as every other module does. */
    const saveDetails = async (input: TourInput, files: TourFiles) => {
        setSaving(true);
        setNotice(null);
        setDetailsProblem(NO_PROBLEM);

        try {
            const saved = await updateTour(id, input, files);

            void navigate(paths.admin.tours, {
                state: { notice: `“${saved.tour_name}” has been saved.` },
            });
        } catch (problem) {
            const normalized = normalizeError(problem);

            setDetailsProblem({
                message: normalized.message,
                fields: normalized.fieldErrors,
            });
            setTab('details');
        } finally {
            setSaving(false);
        }
    };

    /**
     * The content: saved in place, staying on the screen.
     *
     * Deliberately not the same ending as the details. Writing a page is done
     * in passes — add three days, save, read them back, add three more — and a
     * save that threw the editor back to the list every time would make that
     * unbearable. The reply is the stored truth, so what comes back replaces
     * what is on screen: ids for the new rows, and the numbering the server
     * settled.
     */
    const saveContent = async () => {
        setSaving(true);
        setNotice(null);
        setContentProblem(NO_PROBLEM);

        try {
            const saved = await saveTourContent(id, content);

            setContent(toContentInput(saved));
            setNotice('The page content has been saved.');
        } catch (problem) {
            const normalized = normalizeError(problem);

            setContentProblem({
                message: normalized.message,
                fields: normalized.fieldErrors,
            });
            setTab('content');
        } finally {
            setSaving(false);
        }
    };

    /* The banner reports whichever tab is showing, so a message never sits over
       a form it has nothing to do with. */
    const shownProblem = tab === 'content' ? contentProblem : detailsProblem;

    return (
        <FormPage
            breadcrumbs={[
                { label: 'Tours', href: paths.admin.tours },
                { label: tour?.tour_name ?? 'Edit' },
            ]}
            title="Edit tour"
            error={tour ? shownProblem.message || null : null}
        >
            {isLoading ? (
                <FormSkeleton />
            ) : tour ? (
                <div className="flex flex-col gap-4">
                    {notice ? (
                        <Alert>
                            <CheckCircle2 />
                            <AlertDescription>{notice}</AlertDescription>
                        </Alert>
                    ) : null}

                    <FormTabs
                        active={tab}
                        onActiveChange={setTab}
                        tabs={[
                            {
                                id: 'details',
                                label: 'Details',
                                description:
                                    'What the CRM records, what the page says about itself, and whether it is live.',
                                hasError: Object.keys(detailsProblem.fields).length > 0,
                                panel: (
                                    <TourForm
                                        initial={toInput(tour)}
                                        existing={tour}
                                        isSaving={isSaving}
                                        fieldErrors={detailsProblem.fields}
                                        submitLabel="Save changes"
                                        onSubmit={(input, files) => void saveDetails(input, files)}
                                    />
                                ),
                            },
                            {
                                id: 'content',
                                label: 'Page content',
                                description:
                                    'The trip itself — the day-by-day, the highlights, what the price covers. Saved on its own.',
                                hasError: Object.keys(contentProblem.fields).length > 0,
                                panel: (
                                    <TourContentForm
                                        value={content}
                                        isSaving={isSaving}
                                        fieldErrors={contentProblem.fields}
                                        onChange={setContent}
                                        onSubmit={() => void saveContent()}
                                    />
                                ),
                            },
                        ]}
                    />
                </div>
            ) : (
                <LoadFailure
                    message={loadError ?? 'That tour could not be found.'}
                    backHref={paths.admin.tours}
                    backLabel="Back to Tours"
                    onRetry={() => {
                        setLoading(true);
                        void load();
                    }}
                />
            )}
        </FormPage>
    );
}
