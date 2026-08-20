import { ArrowRight } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

const fieldClass =
    'w-full rounded-xl border border-hairline bg-surface px-[18px] py-[14px] text-[15px] text-ink outline-none transition-colors placeholder:text-ink-muted focus-visible:border-brand';

const labelClass = 'mb-2 block text-[12px] font-bold tracking-[0.14em] text-ink-muted uppercase';

type EnquiryFormProps = {
    /** Prefixes every field id, so two forms can share one page. */
    id: string;
    /** Pre-fills the message box — a tour page names the tour. */
    subject?: string;
    /** Shown above the fields; the enquiry page omits it. */
    title?: string;
    submitLabel?: string;
    /** The registration form asks for an age; the tour enquiry does not. */
    askAge?: boolean;
    className?: string;
};

/**
 * The enquiry form.
 *
 * Static by design for now: there is no endpoint behind it yet, so it validates
 * with the browser's own constraints and then shows an acknowledgement in
 * place, rather than posting somewhere that would silently drop it. Wiring it
 * up later is a matter of replacing the submit handler — the markup, the field
 * names and the layout are already what a real submission needs.
 */
export function EnquiryForm({
    id,
    subject,
    title,
    submitLabel = 'Send enquiry',
    askAge = false,
    className,
}: EnquiryFormProps) {
    const [isSent, setIsSent] = useState(false);

    if (isSent) {
        return (
            <div
                className={cn(
                    'rounded-2xl border border-hairline bg-surface p-[clamp(28px,4vw,44px)] text-center',
                    className,
                )}
            >
                <h3 className="voy-heading mb-3 text-[clamp(22px,2.4vw,30px)]">
                    Thank you — we have your details.
                </h3>
                <p className="mx-auto max-w-[46ch] text-[15.5px]/[1.6] text-ink-muted">
                    One of our travel hosts will be in touch within one working day. If it is
                    urgent, do call us — we would rather talk it through.
                </p>
            </div>
        );
    }

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                setIsSent(true);
            }}
            className={cn(
                'rounded-2xl border border-hairline bg-surface p-[clamp(24px,3.4vw,40px)]',
                className,
            )}
        >
            {title ? (
                <h3 className="voy-heading mb-[clamp(24px,3vw,32px)] text-[clamp(22px,2.4vw,30px)]">
                    {title}
                </h3>
            ) : null}

            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(210px,100%),1fr))] gap-x-5 gap-y-[22px]">
                <div>
                    <label htmlFor={`${id}-name`} className={labelClass}>
                        Full name
                    </label>
                    <input
                        id={`${id}-name`}
                        name="name"
                        type="text"
                        required
                        autoComplete="name"
                        placeholder="Your name"
                        className={fieldClass}
                    />
                </div>

                {askAge ? (
                    <div>
                        <label htmlFor={`${id}-age`} className={labelClass}>
                            Age
                        </label>
                        <input
                            id={`${id}-age`}
                            name="age"
                            type="number"
                            min={50}
                            max={110}
                            required
                            placeholder="50 and above"
                            className={fieldClass}
                        />
                    </div>
                ) : null}

                <div>
                    <label htmlFor={`${id}-mobile`} className={labelClass}>
                        Mobile
                    </label>
                    <input
                        id={`${id}-mobile`}
                        name="mobile"
                        type="tel"
                        required
                        autoComplete="tel"
                        placeholder="+91"
                        className={fieldClass}
                    />
                </div>

                <div>
                    <label htmlFor={`${id}-email`} className={labelClass}>
                        Email
                    </label>
                    <input
                        id={`${id}-email`}
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        className={fieldClass}
                    />
                </div>
            </div>

            <div className="mt-[22px]">
                <label htmlFor={`${id}-message`} className={labelClass}>
                    Tell us about you
                </label>
                <textarea
                    id={`${id}-message`}
                    name="message"
                    rows={4}
                    defaultValue={subject ? `I would like to know more about ${subject}.` : ''}
                    placeholder="Where you would like to go, who you would travel with, anything we should know."
                    className={cn(fieldClass, 'resize-y')}
                />
            </div>

            <label
                htmlFor={`${id}-consent`}
                className="mt-6 flex items-start gap-3 text-[14px]/[1.55] text-ink-muted"
            >
                <input
                    id={`${id}-consent`}
                    name="consent"
                    type="checkbox"
                    required
                    className="mt-1 size-[17px] shrink-0 accent-brand"
                />
                <span>
                    I agree to receive trip updates and event invitations by email, SMS and
                    WhatsApp.
                </span>
            </label>

            <Button type="submit" variant="brand" size="pill" className="mt-8 px-[30px]">
                {submitLabel}
                <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
        </form>
    );
}
