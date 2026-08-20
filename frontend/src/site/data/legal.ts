import type { LegalSection } from '@/site/components/legal-page';

/**
 * The privacy policy and the booking terms.
 *
 * Held as data rather than markup so the pages stay one component, and so these
 * documents can later be edited by someone who is not a developer. They restate
 * how the site and the club actually operate; they are not a substitute for a
 * review by the company's own counsel before launch.
 */

export const privacyUpdated = '17 August 2026';

export const privacySections: LegalSection[] = [
    {
        heading: 'Who we are',
        body: [
            '50+ Voyagers is a travel and adventure club for people aged fifty and over, operating from Bengaluru, Karnataka, India. When this policy says “we” or “us”, it means 50+ Voyagers.',
            'If you have a question about anything below, or you would like us to act on one of the rights described further down, write to info@50plusvoyagers.com and a person will answer you.',
        ],
    },
    {
        heading: 'What we collect',
        body: [
            'We only ask for what we need in order to plan a trip and to keep you informed about it:',
            [
                'Your name, age, email address and mobile number, given when you register or make an enquiry.',
                'Travel details you choose to share — destinations of interest, dietary requirements, mobility needs and any medical information relevant to your safety on a departure.',
                'Booking and payment records, including the amounts paid and when. We do not store card numbers; payments are handled by our payment provider.',
                'Basic technical information collected automatically when you use this website, such as the pages you visited and the browser you used.',
            ],
        ],
    },
    {
        heading: 'Why we hold it',
        body: [
            'To plan, book and host your trip, including passing the details a hotel, airline or transport operator needs in order to carry you.',
            'To keep you informed about departures, day-outs and workshops, where you have asked us to. Every such message has a way to stop receiving them.',
            'To meet legal and tax obligations, and to keep the records a tour operator is required to keep.',
        ],
    },
    {
        heading: 'Who we share it with',
        body: [
            'Only with the people who need it to deliver your trip: the hotels you will stay in, the transport operators who will carry you, the visa authorities of the country you are visiting, and our insurance and payment partners.',
            'We do not sell your details, and we do not pass them to anyone for their own marketing.',
        ],
    },
    {
        heading: 'Messages you receive from us',
        body: [
            'When you register you consent to receive trip updates and event invitations by email, SMS and WhatsApp. You can withdraw that consent at any time — reply STOP to a message, use the unsubscribe link in any email, or write to us — and we will act on it promptly.',
            'Withdrawing marketing consent does not stop the operational messages about a trip you have already booked, which we have to send.',
        ],
    },
    {
        heading: 'Medical information',
        body: [
            'Any health information you give us is held with particular care and shared only where it is needed for your safety — with the tour manager on your departure, and, in an emergency, with medical staff treating you.',
        ],
    },
    {
        heading: 'How long we keep it',
        body: [
            'Enquiry details are kept for two years unless you ask us to remove them sooner. Booking and financial records are kept for as long as tax and accounting law requires, currently eight years.',
        ],
    },
    {
        heading: 'Your rights',
        body: [
            'You may ask us at any time to:',
            [
                'tell you what information we hold about you,',
                'correct anything that is wrong,',
                'delete what we no longer need to keep,',
                'stop sending you marketing messages.',
            ],
            'Write to info@50plusvoyagers.com and we will respond within thirty days.',
        ],
    },
    {
        heading: 'Cookies',
        body: [
            'This website uses cookies that are necessary for it to function, and analytics cookies that tell us which pages are read. Analytics cookies can be refused in your browser settings without affecting the site.',
        ],
    },
    {
        heading: 'Changes to this policy',
        body: [
            'When this policy changes we update the date at the top of the page. Material changes are also announced to members by email.',
        ],
    },
];

export const termsUpdated = '17 August 2026';

export const termsSections: LegalSection[] = [
    {
        heading: 'These terms',
        body: [
            'These terms apply to every booking made with 50+ Voyagers, whether for a group tour, a gift holiday, a day-out or a workshop. Making a booking means accepting them.',
            'Your booking confirmation forms part of the contract, and where it names a specific inclusion, price or cancellation schedule for your trip, that document takes precedence over the general position set out here.',
        ],
    },
    {
        heading: 'Eligibility',
        body: [
            'Membership and travel are open to anyone aged fifty and over. A younger companion may travel with a member at our discretion, and we will say so plainly at the time of booking rather than after it.',
        ],
    },
    {
        heading: 'Booking and payment',
        body: [
            'A seat is held once we receive the deposit named in your booking confirmation. The balance is due thirty days before departure, or immediately if you book inside that window.',
            'Members may pay the balance in instalments across the months before departure, at no interest, by arrangement with us in advance.',
            'Prices are quoted per person and are held for the departure named. Where a price is marked “on request”, it is confirmed to you in writing before any payment is taken.',
        ],
    },
    {
        heading: 'What the price includes',
        body: [
            'Each trip page and each booking confirmation lists its own inclusions and exclusions. Unless stated otherwise, the price does not include airfare to the starting city, visa fees, travel insurance, tips, or personal expenses.',
        ],
    },
    {
        heading: 'Cancellation by you',
        body: [
            'Cancellation charges reflect what our suppliers charge us, and rise as the departure approaches:',
            [
                'More than 60 days before departure: the deposit, less a refundable portion where our suppliers allow it.',
                'Between 60 and 30 days: 50% of the trip price.',
                'Fewer than 30 days, or no-show: 100% of the trip price.',
            ],
            'Airfare, visa fees and permits, once issued, are governed by the rules of the airline or authority concerned and are usually non-refundable. We strongly recommend travel insurance with cancellation cover.',
        ],
    },
    {
        heading: 'Cancellation or change by us',
        body: [
            'A departure runs on a minimum group size. If we cannot reach it, we will tell you at least twenty-one days before departure and offer you a full refund or a transfer to another trip.',
            'Weather, permits, political conditions and the state of a mountain road can all force a change of itinerary. Where that happens we substitute an arrangement of comparable standard and tell you why.',
            'Where a change is forced by circumstances beyond our control, we are not liable for costs you incurred independently, such as a separately booked flight.',
        ],
    },
    {
        heading: 'Health, fitness and mobility',
        body: [
            'Every itinerary is graded and each day’s walking is described in advance. You are responsible for satisfying yourself that a trip suits your health and mobility, and for telling us about any condition that could affect your safety or the group’s.',
            'We may decline a booking, or ask a traveller not to join a particular excursion, where we honestly believe the activity is unsafe for them. We would always rather have that conversation before you pay than on a mountain road.',
        ],
    },
    {
        heading: 'Insurance',
        body: [
            'Travel insurance is mandatory on all international departures and strongly recommended on domestic ones. It must cover medical treatment, repatriation and cancellation. We can introduce you to an insurer who covers travellers over seventy.',
        ],
    },
    {
        heading: 'Conduct on a trip',
        body: [
            'These are small groups, and they work because everyone in them looks after everyone else. We may end a traveller’s trip, without refund, where their behaviour puts others at risk or persistently spoils the trip for the group.',
        ],
    },
    {
        heading: 'Photographs',
        body: [
            'We take photographs on departures and may use them in our own marketing. Tell your tour manager if you would rather not appear in them, and we will respect that without argument.',
        ],
    },
    {
        heading: 'Complaints',
        body: [
            'Tell your tour manager while you are still on the trip, so that we have a chance to put it right. If the matter is unresolved when you get home, write to info@50plusvoyagers.com within twenty-eight days and we will respond in writing.',
        ],
    },
    {
        heading: 'Governing law',
        body: [
            'These terms are governed by the laws of India, and the courts of Bengaluru, Karnataka have exclusive jurisdiction over any dispute arising from them.',
        ],
    },
];
