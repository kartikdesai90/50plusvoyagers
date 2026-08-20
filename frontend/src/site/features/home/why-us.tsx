import { ArrowRight, Check } from 'lucide-react';

import { Container, Eyebrow, Section } from '@/site/components/section';
import { SiteImage } from '@/site/components/site-image';
import { Button } from '@/shared/ui/button';
import type { WhyUs as WhyUsContent } from '@/site/types/why-us';

/**
 * Why travel with us.
 *
 * The points, the photograph, the words over it and the button come from the
 * band an editor writes. The two lines above them do not, and neither does the
 * shape — two columns, a ticked list, a scrim over the bottom of the picture.
 * Those name and lay out the section rather than saying anything that changes.
 *
 * Each part draws only when there is something in it. A band with no button is
 * a band that ends at its list, and a band with no caption is a photograph with
 * nothing over it rather than an empty box darkening the bottom of one.
 */
export function WhyUs({ content }: { content: WhyUsContent }) {
    const { points, button, image, caption } = content;

    return (
        <Section tone="alt" bottom="none">
            <Container>
                <div
                    data-voy-group
                    className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] items-center gap-[clamp(36px,5vw,72px)]"
                >
                    <div>
                        <Eyebrow className="mb-5">Why travel with us</Eyebrow>
                        <h2 className="voy-heading mb-[22px] text-[clamp(28px,3.4vw,44px)]/[1.08]">
                            We don&apos;t just take you somewhere. We make sure no one ever feels
                            like the odd one out.
                        </h2>

                        {points.length > 0 ? (
                            <ul className="mb-8 flex flex-col gap-4">
                                {/*
                                 * Keyed by position: the list is rendered in the
                                 * order it arrives and nothing reorders it in
                                 * the browser, so a point never swaps identity
                                 * with its neighbour behind React's back. The
                                 * words themselves are not unique enough to key
                                 * on — an editor may write the same line twice.
                                 */}
                                {points.map((point, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center gap-[13px] text-base font-medium text-ink"
                                    >
                                        <Check
                                            className="size-5 shrink-0 text-brand"
                                            strokeWidth={1.7}
                                            aria-hidden="true"
                                        />
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        ) : null}

                        {button ? (
                            <Button asChild variant="brand" size="pill">
                                <a href={button.url}>
                                    {button.text}
                                    <ArrowRight className="size-4" aria-hidden="true" />
                                </a>
                            </Button>
                        ) : null}
                    </div>

                    <div className="group relative overflow-hidden rounded-xl">
                        <div className="relative h-[clamp(360px,42vw,520px)] w-full">
                            <SiteImage
                                src={image.url}
                                alt={image.alt}
                                /* Half the measure on desktop, full width on a phone. */
                                sizes="(max-width: 900px) 100vw, 560px"
                                className="object-cover"
                            />
                        </div>
                        {caption ? (
                            <div className="voy-overlay bg-linear-to-t from-[rgb(16_15_12/0.82)] via-[rgb(16_15_12/0.2)] via-55% to-transparent to-82% p-7">
                                {caption.heading ? (
                                    <div className="font-serif text-[26px]/[1.1] font-normal">
                                        {caption.heading}
                                    </div>
                                ) : null}
                                {caption.text ? (
                                    <div className="mt-2 text-[15px] text-white/85">
                                        {caption.text}
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </div>
            </Container>
        </Section>
    );
}
