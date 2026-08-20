import { Container, Eyebrow, Section, SectionHeading } from '@/site/components/section';
import { hostingSteps } from '@/site/data/home';

export function FullyHosted() {
    return (
        <Section top="none" bottom="none">
            <Container>
                <div className="mx-auto mb-[clamp(44px,5vw,64px)] max-w-[640px] text-center">
                    <Eyebrow className="mb-[18px]">On every departure</Eyebrow>
                    <SectionHeading size="h3">
                        What &quot;fully hosted&quot; *really* means
                    </SectionHeading>
                </div>

                <ol
                    data-voy-group
                    className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-[clamp(28px,3vw,44px)]"
                >
                    {hostingSteps.map((step, i) => (
                        <li key={step.title} className="border-t-2 border-brand pt-[22px]">
                            <div className="mb-3.5 font-serif text-2xl font-normal text-ink-muted opacity-60">
                                {String(i + 1).padStart(2, '0')}
                            </div>
                            <h3 className="mb-2.5 text-xs font-bold tracking-[0.16em] text-ink uppercase">
                                {step.title}
                            </h3>
                            <p className="text-[15px]/[1.58] text-ink-muted">{step.body}</p>
                        </li>
                    ))}
                </ol>
            </Container>
        </Section>
    );
}
