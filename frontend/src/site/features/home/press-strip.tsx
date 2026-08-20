import { Star } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Container, Eyebrow, Section } from '@/site/components/section';
import { pressLogos } from '@/site/data/home';

export function PressStrip() {
    return (
        <Section tone="alt" top="sm" bottom="sm">
            <Container className="text-center">
                <Eyebrow className="mb-[18px]">As featured in</Eyebrow>
                <p className="mx-auto max-w-[24ch] font-serif text-[clamp(19px,2.2vw,26px)]/[1.3] font-normal text-balance text-ink italic sm:max-w-[46ch]">
                    Trusted by 2,400+ travellers &amp; written about across India&apos;s national
                    press
                </p>

                {/*
                    Plain wordmark rows, as the reference has them. The basis is
                    pinned to an exact fraction of the row so the wrap is fixed at
                    3-up (9 = 3+3+3) and 5-up on desktop (9 = 5+4) instead of being
                    left to the text widths -- justify-center then centres the short
                    last row, and no row can end on a single stranded mark.
                */}
                <ul
                    data-voy-group
                    className="mt-[clamp(26px,3.4vw,38px)] flex flex-wrap items-center justify-center gap-x-4 gap-y-[clamp(20px,2.8vw,30px)] lg:gap-x-10"
                >
                    {pressLogos.map((logo) => (
                        <li
                            key={logo.name}
                            className="flex min-h-[2.2em] basis-[calc((100%-2rem)/3)] items-center justify-center lg:basis-[calc((100%-10rem)/5)]"
                        >
                            <span
                                className={cn(
                                    'text-ink/55 transition-colors duration-500 ease-out hover:text-ink/85 motion-reduce:transition-none',
                                    logo.className,
                                )}
                            >
                                {logo.name}
                            </span>
                        </li>
                    ))}
                </ul>

                <div className="mt-[clamp(26px,3.6vw,40px)] border-t border-hairline pt-[clamp(18px,2.4vw,26px)]">
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
                        <span className="flex gap-[3px]" aria-hidden="true">
                            {Array.from({ length: 5 }, (_, i) => (
                                <Star key={i} className="size-[17px] fill-brand text-brand" />
                            ))}
                        </span>
                        <span className="text-[15px] font-bold text-ink">4.8 / 5</span>
                        <span aria-hidden="true" className="hidden h-4 w-px bg-hairline sm:block" />
                        <span className="text-sm text-ink-muted">
                            Rated Excellent by 2,400+ voyagers
                        </span>
                    </div>
                </div>
            </Container>
        </Section>
    );
}
