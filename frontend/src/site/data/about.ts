/**
 * About us, membership, and the questions people ask before they book.
 *
 * All static, all shaped so a CMS can take it over field by field.
 */

const img = (name: string) => `/images/home/${name}.webp`;

export const aboutFacts = [
    { label: 'Members', value: '25,000+' },
    { label: 'Destinations', value: '90+' },
    { label: 'Trips hosted', value: '1,000+' },
    { label: 'Guests per group', value: '12–16' },
];

export const aboutStory = [
    'We started 50+ Voyagers because of a specific complaint, heard often enough that it stopped sounding like a complaint and started sounding like a brief: “Every tour I look at is built for somebody thirty years younger than me.”',
    'Six cities in five days. Coaches that leave at six. Hotels chosen for price rather than for whether there is a lift. And a group in which you are, invariably, the oldest person by a decade and quietly made aware of it.',
    'So we built the opposite. Small groups of twelve to sixteen, everybody fifty or over. One place a day. Hotels with lifts and walk-in showers. A tour manager on every departure whose actual job is to make sure nobody feels like the odd one out.',
    'Ten years on, the club is 25,000 members strong and has hosted over a thousand trips across ninety destinations. Most of our travellers come back. A good number of them come back with somebody they met on the last one.',
];

export const aboutValues = [
    {
        title: 'Age is no bar',
        body: 'Rafting the Zanskar at sixty-eight. First passport at seventy. We plan for what you can do, not for what the number suggests.',
        src: img('value-small-groups'),
    },
    {
        title: 'Nobody left behind',
        body: 'Every walk is graded, every alternative is real, and turning back is never treated as a failure by anyone on our staff.',
        src: img('value-unhurried-pace'),
    },
    {
        title: 'Hosted, not herded',
        body: 'A tour manager who knows your name, your medicines and how you take your tea, travelling with you the whole way.',
        src: img('value-fully-hosted'),
    },
    {
        title: 'Friendships that last',
        body: 'The trip ends; the WhatsApp group does not. Most of our members travel again with somebody they met on a departure.',
        src: img('value-kindred-company'),
    },
];

export const pressMentions = [
    'Outlook Money',
    'Business Standard',
    'The Times of India',
    'The Economic Times',
    'The Hindu',
    'Deccan Herald',
];

export const membershipBenefits = [
    {
        title: 'Early access to departures',
        body: 'Members see new trips and the annual calendar before anyone else, and the popular ones do fill.',
    },
    {
        title: 'Early-bird pricing',
        body: 'A members-only discount on every departure booked in the early window, on top of any seasonal offer.',
    },
    {
        title: 'Referral bonus & loyalty points',
        body: 'Points on every trip, redeemable against the next one, and a bonus whenever a friend you introduced travels.',
    },
    {
        title: 'Instalment payments',
        body: 'Spread the cost of a trip across the months before it, with no interest and no paperwork.',
    },
    {
        title: 'The WhatsApp community',
        body: 'Real-time alerts on new departures, day-outs and last-minute seats, plus the group chat that outlives every trip.',
    },
    {
        title: 'Day-outs and workshops',
        body: 'Members-only pricing on the Silver Space programme, and a free seat at the fortnightly puzzle circle.',
    },
];

export const membershipSteps = [
    {
        title: 'Register',
        body: 'Fill in the short form below. Membership is open to anyone aged fifty and over, and it costs nothing to join.',
    },
    {
        title: 'We call you',
        body: 'A short, genuinely unpushy conversation about where you would like to go and how you like to travel.',
    },
    {
        title: 'Join the community',
        body: 'You are added to the WhatsApp group and the mailing list, and you start seeing departures before they go public.',
    },
    {
        title: 'Travel when you are ready',
        body: 'No obligation and no expiry. Some members travel within the month; some come to a day-out first and book a year later.',
    },
];

export const faqs = [
    {
        question: 'Is there an age limit?',
        answer: 'There is a lower one — you must be fifty or over — and no upper one. Our oldest traveller last year was eighty-four, on the Rajasthan departure. What matters is not the number but whether the itinerary suits you, and we will tell you honestly if we think it does not.',
    },
    {
        question: 'Can I travel on my own?',
        answer: 'Most of our travellers do. Roughly half of every group is travelling solo, which is precisely why nobody feels conspicuous. We will pair you with a room-mate of the same gender if you would like to avoid the single supplement, or you can have a room to yourself for a surcharge.',
    },
    {
        question: 'How fit do I need to be?',
        answer: 'Fit enough to walk for twenty minutes on the level and to manage a flight of stairs. Every itinerary is graded, and each day’s walking is described in advance so you can judge for yourself. There is always an alternative for anyone who wants to sit one out.',
    },
    {
        question: 'What if I have a medical condition?',
        answer: 'Tell us when you book. Diabetes, hypertension, replaced joints and cardiac history are all common on our trips and none of them is a barrier. We plan the pace, the meals and the altitude around what you tell us, and every high-altitude departure carries oxygen and a first-aid kit.',
    },
    {
        question: 'How large are the groups?',
        answer: 'Between twelve and sixteen travellers, plus a tour manager. On the gift holidays it is smaller still — usually eight to twelve. We do not run coach tours and we do not sell seats on someone else’s.',
    },
    {
        question: 'Can I pay in instalments?',
        answer: 'Yes. Members can spread the cost across the months between booking and departure, at no interest. A deposit secures the seat and the balance is due a month before you travel.',
    },
    {
        question: 'What is your cancellation policy?',
        answer: 'Cancellations more than sixty days before departure carry a small administrative fee. After that, the charge rises as the date approaches, because hotels and airlines charge us. The exact schedule is set out in the terms and in your booking confirmation, and we strongly recommend travel insurance.',
    },
    {
        question: 'Do you arrange visas and insurance?',
        answer: 'We help with both. Visa documentation is prepared for you and checked before submission on all international departures, and we can introduce you to an insurer who covers travellers over seventy without fuss.',
    },
];

export const contactOffices = [
    {
        city: 'Bengaluru — HSR Layout',
        lines: ['HSR Layout, Sector 2', 'Bengaluru 560102', 'Karnataka, India'],
    },
    {
        city: 'Bengaluru — Koramangala',
        lines: ['Koramangala', 'Bengaluru 560034', 'Karnataka, India'],
    },
];

export const contactHours = [
    { day: 'Monday – Saturday', hours: '9:30 am – 6:30 pm IST' },
    { day: 'Sunday', hours: 'WhatsApp only' },
];
