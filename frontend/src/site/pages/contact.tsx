'use client';

import { Clock, Mail, MapPin, Phone } from 'lucide-react';

import { Container, Eyebrow, Section, SectionHeading } from '@/site/components/section';
import { EnquiryForm } from '@/site/components/enquiry-form';
import { FaqList } from '@/site/components/faq-list';
import { NavLink } from '@/site/components/nav-link';
import { PageHero } from '@/site/components/page-hero';
import { WhatsAppIcon } from '@/shared/ui/brand-icons';
import { contactHours, contactOffices, faqs } from '@/site/data/about';
import { siteConfig } from '@/site/config/site';

/**
 * Contact.
 *
 * Channels first, form second. Most of the people who reach this page would
 * rather ring than type, and the number they want — the tour enquiry line — is
 * the largest thing on the screen after the heading. The FAQs are repeated here
 * from the membership page under the `#faqs` anchor the footer points at, since
 * roughly half of what arrives through the form is a question already answered
 * below it.
 */
export default function ContactPage() {
    const channels = [
        {
            icon: Phone,
            label: 'Tour enquiries',
            value: siteConfig.enquiryPhone,
            href: siteConfig.enquiryPhoneHref,
            note: 'Mon–Sat, 9:30 am – 6:30 pm IST',
        },
        {
            icon: Phone,
            label: 'Office',
            value: siteConfig.phone,
            href: siteConfig.phoneHref,
            note: `Alternate line ${siteConfig.phoneAlt}`,
        },
        {
            icon: Mail,
            label: 'Email',
            value: siteConfig.email,
            href: siteConfig.emailHref,
            note: 'We answer within one working day',
        },
        {
            icon: WhatsAppIcon,
            label: 'WhatsApp',
            value: 'Message us',
            href: siteConfig.whatsappHref,
            note: 'Usually the fastest way to reach us',
        },
    ];

    return (
        <>
            <PageHero
                eyebrow="Contact"
                title="Talk to a human who has *walked the trails*."
                lead="No call centres, no scripts and no pressure. Ring us, write to us, or leave your details and we will come back to you within a working day."
            />

            <Section top="sm" bottom="none">
                <Container>
                    <div
                        data-voy-group
                        className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-[clamp(18px,2vw,24px)]"
                    >
                        {channels.map(({ icon: Icon, label, value, href, note }) => (
                            <NavLink
                                key={label + value}
                                href={href}
                                className="rounded-2xl border border-hairline bg-surface p-[26px] text-ink transition-colors hover:border-brand"
                            >
                                <Icon
                                    className="mb-5 size-6 text-brand"
                                    strokeWidth={1.7}
                                    aria-hidden="true"
                                />
                                <span className="block text-[11.5px] font-bold tracking-[0.16em] text-ink-muted uppercase">
                                    {label}
                                </span>
                                <span className="mt-2 block text-[18px] font-bold">{value}</span>
                                <span className="mt-2 block text-[13.5px]/[1.5] text-ink-muted">
                                    {note}
                                </span>
                            </NavLink>
                        ))}
                    </div>
                </Container>
            </Section>

            <Section>
                <Container>
                    <div className="grid items-start gap-[clamp(36px,4vw,64px)] lg:grid-cols-[1fr_380px]">
                        <div>
                            <Eyebrow className="mb-[18px]">Send a message</Eyebrow>
                            <SectionHeading size="h3" className="mb-8">
                                Tell us what you are *planning*
                            </SectionHeading>
                            <EnquiryForm id="contact" submitLabel="Send message" />
                        </div>

                        <aside className="flex flex-col gap-6">
                            <div className="rounded-2xl border border-hairline bg-surface-alt p-[28px]">
                                <MapPin
                                    className="mb-5 size-[22px] text-brand"
                                    strokeWidth={1.7}
                                    aria-hidden="true"
                                />
                                <h3 className="mb-5 text-[11.5px] font-bold tracking-[0.16em] text-ink-muted uppercase">
                                    Where to find us
                                </h3>

                                <div className="flex flex-col gap-6">
                                    {contactOffices.map((office) => (
                                        <div key={office.city}>
                                            <p className="mb-1.5 text-[15.5px] font-bold text-ink">
                                                {office.city}
                                            </p>
                                            <address className="text-[14.5px]/[1.6] text-ink-muted not-italic">
                                                {office.lines.map((line) => (
                                                    <span key={line} className="block">
                                                        {line}
                                                    </span>
                                                ))}
                                            </address>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-hairline bg-surface-alt p-[28px]">
                                <Clock
                                    className="mb-5 size-[22px] text-brand"
                                    strokeWidth={1.7}
                                    aria-hidden="true"
                                />
                                <h3 className="mb-5 text-[11.5px] font-bold tracking-[0.16em] text-ink-muted uppercase">
                                    When we are open
                                </h3>

                                <dl className="flex flex-col gap-3 text-[14.5px]">
                                    {contactHours.map((entry) => (
                                        <div
                                            key={entry.day}
                                            className="flex flex-wrap justify-between gap-x-4 gap-y-1"
                                        >
                                            <dt className="text-ink-muted">{entry.day}</dt>
                                            <dd className="font-semibold text-ink">
                                                {entry.hours}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        </aside>
                    </div>
                </Container>
            </Section>

            <Section id="faqs" tone="alt">
                <Container className="max-w-[860px]">
                    <div className="mb-[clamp(32px,4vw,44px)] text-center">
                        <Eyebrow className="mb-[18px]">Frequently asked</Eyebrow>
                        <SectionHeading size="h3" className="text-balance">
                            You may not need to write *at all*
                        </SectionHeading>
                    </div>

                    <FaqList items={faqs} />
                </Container>
            </Section>
        </>
    );
}
