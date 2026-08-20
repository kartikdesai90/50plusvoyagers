import { ArrowRight } from 'lucide-react';

import { Container, Section } from '@/site/components/section';
import { Button } from '@/shared/ui/button';
import { BandMedia } from '@/site/features/home/band-media';
import { withEmphasis } from '@/site/components/emphasis';
import type { Band } from '@/site/types/band';

/** Full-width photo band with copy over a left-to-right scrim. */
export function ImageDivider({ band }: { band: Band }) {
    return (
        <Section top="sm" bottom="sm">
            <Container>
                <div className="voy-divider">
                    <BandMedia band={band} />
                    <div className="voy-divider-body">
                        {/*
                         * Marked the same way the hero heading is. It is the
                         * same database field an editor types either band into,
                         * so `*word*` has to mean the same thing in both — one
                         * of them printing the asterisks would be the notation
                         * working in some places and not others.
                         */}
                        <h2 className="font-serif text-[clamp(27px,3.5vw,46px)]/[1.06] font-normal tracking-[-0.02em] text-balance">
                            {withEmphasis(band.heading)}
                        </h2>
                        {band.description ? (
                            <p className="mt-5 text-[clamp(15px,1.3vw,17px)]/[1.62] text-white/85">
                                {band.description}
                            </p>
                        ) : null}
                        {band.button ? (
                            <Button
                                asChild
                                variant="brand"
                                size="pill"
                                className="mt-[38px] px-[30px]"
                            >
                                <a href={band.button.url}>
                                    {band.button.text}
                                    <ArrowRight className="size-4" aria-hidden="true" />
                                </a>
                            </Button>
                        ) : null}
                    </div>
                </div>
            </Container>
        </Section>
    );
}
