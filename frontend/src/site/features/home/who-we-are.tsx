import { Container, Eyebrow, Section, SectionHeading } from '@/site/components/section';
import { SiteImage } from '@/site/components/site-image';
import type { WhoWeAreCard } from '@/site/types/who-we-are';

/**
 * Who we are.
 *
 * The cards come from the database; the two lines above them do not. Those name
 * the section rather than saying anything that changes, so they stay here
 * beside the layout they title — the same reason the section's grid is not the
 * database's to decide either.
 */
export function WhoWeAre({ cards }: { cards: WhoWeAreCard[] }) {
    return (
        <Section id="why">
            <Container>
                <div className="max-w-[680px]">
                    <Eyebrow className="mb-5">Who we are</Eyebrow>
                    <SectionHeading>
                        Journeys designed for the *young at heart*, not the young in years.
                    </SectionHeading>
                </div>

                <div
                    data-voy-group
                    className="mt-[clamp(40px,5vw,64px)] grid grid-cols-[repeat(auto-fit,minmax(min(230px,100%),1fr))] gap-[clamp(22px,3vw,36px)]"
                >
                    {cards.map((card) => (
                        <div key={card.id}>
                            <div className="relative h-[190px] overflow-hidden rounded-lg">
                                <SiteImage
                                    src={card.image_url}
                                    alt={card.image_alt}
                                    /* Four-up at the widest, dropping to one across on a phone. */
                                    sizes="(max-width: 560px) 100vw, (max-width: 1180px) 50vw, 280px"
                                    className="object-cover"
                                />
                            </div>
                            <div className="mt-[18px] mb-2 text-xs font-bold tracking-[0.16em] text-ink uppercase">
                                {card.title}
                            </div>
                            {card.body ? (
                                <p className="text-[15px]/[1.55] text-ink-muted">{card.body}</p>
                            ) : null}
                        </div>
                    ))}
                </div>
            </Container>
        </Section>
    );
}
