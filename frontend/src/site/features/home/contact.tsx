'use client';

import { Mail, Phone } from 'lucide-react';
import type * as React from 'react';

import { Container, Section, SectionHeading } from '@/site/components/section';
import { WhatsAppIcon } from '@/site/components/brand-icons';
import { Button } from '@/shared/ui/button';
import { siteConfig } from '@/site/config/site';
import { paths } from '@/routes/paths';

type Channel = {
    icon: React.ComponentType<React.ComponentProps<'svg'> & { strokeWidth?: number }>;
    label: string;
    value: string;
    href: string;
};

const channels: Channel[] = [
    { icon: Phone, label: 'Call us', value: siteConfig.phone, href: siteConfig.phoneHref },
    { icon: Mail, label: 'Email us', value: siteConfig.email, href: siteConfig.emailHref },
    { icon: WhatsAppIcon, label: 'WhatsApp', value: 'Reply in minutes', href: paths.home },
];

export function Contact() {
    return (
        <Section tone="alt">
            <Container className="max-w-[900px] text-center">
                <SectionHeading className="mb-3.5 text-[clamp(30px,4.4vw,54px)]">
                    Ready when *you* are.
                </SectionHeading>
                <p className="mx-auto mb-10 max-w-[480px] text-[17px]/[1.6] text-ink-muted">
                    Talk to a real human who has walked the trails. No call centres, no pressure.
                </p>

                <div
                    data-voy-group
                    className="mb-[clamp(48px,6vw,72px)] flex flex-wrap justify-center gap-[clamp(16px,2vw,24px)]"
                >
                    {channels.map(({ icon: Icon, label, value, href }) => (
                        <a
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
                        </a>
                    ))}
                </div>

                <div className="border-t border-hairline pt-[clamp(40px,5vw,56px)]">
                    <p className="mb-4 text-[12px]/none font-bold tracking-[0.22em] text-ink-muted uppercase">
                        Be the first to hear about new departures
                    </p>
                    {/* Wire to a newsletter endpoint when one exists. */}
                    <form
                        onSubmit={(event) => event.preventDefault()}
                        className="mx-auto flex max-w-[480px] flex-wrap justify-center gap-2.5"
                    >
                        <label htmlFor="newsletter-email" className="sr-only">
                            Your email address
                        </label>
                        <input
                            id="newsletter-email"
                            type="email"
                            name="email"
                            required
                            placeholder="Your email address"
                            className="w-full min-w-0 flex-1 rounded-full sm:w-auto sm:min-w-[220px] border border-hairline bg-surface px-6 py-[15px] text-[15px] text-ink outline-none placeholder:text-ink-muted focus-visible:border-brand"
                        />
                        <Button type="submit" variant="brand" size="pill" className="px-[30px]">
                            Sign up
                        </Button>
                    </form>
                </div>
            </Container>
        </Section>
    );
}
