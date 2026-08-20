import Link from 'next/link';
import type * as React from 'react';

import { Container } from '@/site/components/section';
import {
    FacebookIcon,
    InstagramIcon,
    LinkedInIcon,
    OtherLinkIcon,
    WhatsAppIcon,
    XIcon,
    YouTubeIcon,
} from '@/site/components/brand-icons';
import { NavLink } from '@/site/components/nav-link';
import { paths } from '@/routes/paths';
import { siteConfig } from '@/site/config/site';
import type { SiteSettings, SocialPlatform } from '@/site/types/settings';

/** The mark drawn for each network, and a plain link for anything else. */
const MARKS: Record<SocialPlatform, React.ComponentType<React.ComponentProps<'svg'>>> = {
    instagram: InstagramIcon,
    facebook: FacebookIcon,
    youtube: YouTubeIcon,
    linkedin: LinkedInIcon,
    twitter: XIcon,
    whatsapp: WhatsAppIcon,
    link: OtherLinkIcon,
};

/**
 * The site footer.
 *
 * The four navigation columns are still the site's own configuration: they are
 * a map of the pages this application has, which is a fact about the code
 * rather than something an editor should be able to point at a page that does
 * not exist. Everything else here — the name, the profiles, the words after
 * the © — comes from the settings, and falls back to what the design ships
 * with wherever one is missing.
 *
 * The telephone number, the email address and the postal address are not
 * printed here. They are on the contact page and in the bands that ask for an
 * enquiry, which is where somebody looking for them goes.
 *
 * Only the profiles with an address are drawn. A mark that pointed at the
 * homepage because nobody had confirmed the handle was worse than no mark: it
 * looked like a working link and was not one.
 */
export function SiteFooter({ settings }: { settings: SiteSettings }) {
    const { footerNav } = siteConfig;
    const { company_name: name, socials, footer_links: extraLinks } = settings;

    return (
        <footer className="border-t border-hairline bg-surface-alt pt-[clamp(56px,6vw,88px)]">
            <Container>
                <div className="border-b border-hairline pb-11 text-center">
                    <Link
                        href={paths.home}
                        className="mb-5 inline-flex items-center gap-[11px]"
                        aria-label={`${name} — home`}
                    >
                        {settings.logo_url ? (
                            <img
                                src={settings.logo_url}
                                alt={settings.logo_alt || name}
                                className="h-10 w-auto object-contain"
                            />
                        ) : (
                            <>
                                <span className="flex size-10 items-center justify-center rounded-full bg-brand font-serif text-sm font-semibold text-white">
                                    50+
                                </span>
                                <span className="font-serif text-[23px] font-semibold text-ink">
                                    Voyagers
                                </span>
                            </>
                        )}
                    </Link>

                    {settings.footer_description ? (
                        <p className="mx-auto mb-5 max-w-[520px] text-[15px]/[1.6] text-ink-muted">
                            {settings.footer_description}
                        </p>
                    ) : null}

                    {socials.length > 0 ? (
                        <ul className="flex justify-center gap-3.5">
                            {socials.map((social) => {
                                const Icon = MARKS[social.platform] ?? OtherLinkIcon;

                                return (
                                    <li key={`${social.platform}-${social.url}`}>
                                        <NavLink
                                            href={social.url}
                                            aria-label={social.label}
                                            className="flex size-10 items-center justify-center rounded-full border border-hairline text-ink transition-colors hover:border-brand hover:text-brand"
                                        >
                                            <Icon className="size-[18px]" />
                                        </NavLink>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : null}
                </div>

                <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-9 py-11">
                    {footerNav.map((group) => (
                        <div key={group.title}>
                            <h2 className="mb-4 text-[11.5px] font-extrabold tracking-[0.16em] text-ink-muted uppercase">
                                {group.title}
                            </h2>
                            <ul className="flex flex-col gap-[11px] text-[14.5px]">
                                {group.links.map((link) => (
                                    <li key={link.label}>
                                        <NavLink
                                            href={link.href}
                                            className="text-ink transition-colors hover:text-brand"
                                        >
                                            {link.label}
                                        </NavLink>
                                    </li>
                                ))}
                                {/*
                                 * Whatever an editor added, alongside the legal
                                 * pages rather than in a column of its own — a
                                 * fifth heading for one link would unbalance the
                                 * row it sits in.
                                 */}
                                {group.title === 'Legal'
                                    ? extraLinks.map((link) => (
                                          <li key={link.url}>
                                              <NavLink
                                                  href={link.url}
                                                  className="text-ink transition-colors hover:text-brand"
                                              >
                                                  {link.label}
                                              </NavLink>
                                          </li>
                                      ))
                                    : null}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* The year is added here rather than stored: one written into a
                    database is a year that is wrong every January. */}
                <p className="border-t border-hairline py-6 pb-8 text-center text-[13px] text-ink-muted">
                    &copy; {new Date().getFullYear()} {settings.copyright_text}
                </p>
            </Container>
        </footer>
    );
}
