import { ArrowRight, Mail, Phone } from 'lucide-react';

import { Container, Section, SectionHeading } from '@/site/components/section';
import { NavLink } from '@/site/components/nav-link';
import { WhatsAppIcon } from '@/site/components/brand-icons';
import { Button } from '@/shared/ui/button';
import { siteConfig } from '@/site/config/site';

type CtaBandProps = {
    heading?: string;
    body?: string;
    action?: { label: string; href: string };
    /** `alt` is the warm neutral; use it when the section above is white. */
    tone?: 'surface' | 'alt';
};

/**
 * The closing invitation, shared by every inner page.
 *
 * It is the homepage's contact section reduced to its load-bearing half — the
 * same heading scale, the same three bordered channel tiles — so a page can end
 * on a real invitation without each one inventing its own.
 */
export function CtaBand({
    heading = 'Ready when you are.',
    body = 'Talk to a real human who has walked the trails. No call centres, no pressure.',
    action,
    tone = 'alt',
}: CtaBandProps) {
    const channels = [
        {
            icon: Phone,
            label: 'Call us',
            value: siteConfig.enquiryPhone,
            href: siteConfig.enquiryPhoneHref,
        },
        { icon: Mail, label: 'Email us', value: siteConfig.email, href: siteConfig.emailHref },
        {
            icon: WhatsAppIcon,
            label: 'WhatsApp',
            value: 'Reply in minutes',
            href: siteConfig.whatsappHref,
        },
    ];

    return (
        <Section tone={tone}>
            <Container className="max-w-[900px] text-center">
                <SectionHeading className="mb-3.5 text-[clamp(30px,4.4vw,54px)]">
                    {heading}
                </SectionHeading>
                <p className="mx-auto mb-10 max-w-[520px] text-[17px]/[1.6] text-ink-muted">
                    {body}
                </p>

                <div
                    data-voy-group
                    className="flex flex-wrap justify-center gap-[clamp(16px,2vw,24px)]"
                >
                    {channels.map(({ icon: Icon, label, value, href }) => (
                        <NavLink
                            key={label}
                            href={href}
                            className="flex items-center gap-3 rounded-xl border border-hairline bg-surface px-[26px] py-[18px] text-ink transition-colors hover:border-brand"
                        >
                            <Icon
                                className="size-5 shrink-0 text-brand"
                                strokeWidth={1.7}
                                aria-hidden="true"
                            />
                            <span className="text-left">
                                <span className="block text-[15px] font-bold">{label}</span>
                                <span className="block text-[13px] text-ink-muted">{value}</span>
                            </span>
                        </NavLink>
                    ))}
                </div>

                {action ? (
                    <div className="mt-[clamp(40px,5vw,56px)]">
                        <Button asChild variant="brand" size="pill">
                            <NavLink href={action.href}>
                                {action.label}
                                <ArrowRight className="size-4" aria-hidden="true" />
                            </NavLink>
                        </Button>
                    </div>
                ) : null}
            </Container>
        </Section>
    );
}
