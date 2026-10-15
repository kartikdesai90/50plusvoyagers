/**
 * Single source of truth for client-side URLs.
 * Import from here instead of hard-coding strings in components.
 */
export const paths = {
    home: '/',

    /*
     * The public site. Every one of these is a real server route rendering an
     * Inertia page, so an internal link is an `Inertia.Link`, never an anchor.
     * The `#`-prefixed entries below are homepage sections, not pages, and are
     * written absolute so they resolve from any route.
     */
    about: '/about',
    groupTours: '/group-tours',
    groupTour: '/group-tours/:slug',
    membership: '/membership',
    blog: '/blog',
    blogPost: '/blog/:slug',
    gallery: '/gallery',
    contact: '/contact',
    privacy: '/privacy-policy',
    terms: '/terms-and-conditions',

    /** Homepage anchors, absolute so the header works from any route. */
    homeSections: {
        trips: '/#trips',
        why: '/#why',
        stories: '/#stories',
        journal: '/#journal',
    },

    admin: {
        /** Dashboard doubles as the admin index. */
        dashboard: '/admin',
        login: '/admin/login',
        /*
         * The homepage's hero slides and banner bands. Three screens, because
         * they are three jobs: finding one, adding one, changing one. Each gets
         * an address an editor can return to, share or reload.
         */
        heroBanners: '/admin/hero-banner',
        heroBannerCreate: '/admin/hero-banner/create',
        heroBannerEdit: '/admin/hero-banner/:bandId/edit',

        /**
         * The two homepage bands whose content is edited rather than listed —
         * the "Who we are" cards and the "Why travel with us" points — in two
         * tabs of one screen. One address, because they are two bands of one
         * page and are looked after in one sitting.
         */
        homeSections: '/admin/home-sections',

        /** What travellers said — written quotes and filmed ones, one module. */
        feedback: '/admin/feedback',
        feedbackCreate: '/admin/feedback/create',
        feedbackEdit: '/admin/feedback/:feedbackId/edit',

        /** Photographs from the road. */
        gallery: '/admin/gallery',
        galleryCreate: '/admin/gallery/create',
        galleryEdit: '/admin/gallery/:itemId/edit',

        /**
         * Everything true on every page of the site. One screen, not three:
         * there is one set of settings, so there is nothing to list, create or
         * delete — which is why this has no `Create` or `Edit` beside it.
         */
        settings: '/admin/settings',

        /** The journal, as staff write it. `blog` above is where readers find it. */
        blog: '/admin/blog',
        blogCreate: '/admin/blog/create',
        blogEdit: '/admin/blog/:postId/edit',

        /**
         * The group tours, as the CRM records them. `groupTours` above is where
         * travellers browse them — and for now those are two separate things:
         * this module holds the CRM's five fields, and the public listing still
         * runs on its own catalogue until the display fields are agreed.
         */
        tours: '/admin/tours',
        tourCreate: '/admin/tours/create',
        tourEdit: '/admin/tours/:tourId/edit',
    },
} as const;

/** The address of one group tour's page. */
export const groupTourPath = (slug: string): string => `/group-tours/${slug}`;

/** The address of one journal article. */
export const blogPostPath = (slug: string): string => `/blog/${slug}`;

/** The address of one band's edit screen. */
export const heroBannerEditPath = (id: number): string => `/admin/hero-banner/${id}/edit`;

/** The address of one piece of feedback's edit screen. */
export const feedbackEditPath = (id: number): string => `/admin/feedback/${id}/edit`;

/** The address of one photograph's edit screen. */
export const galleryEditPath = (id: number): string => `/admin/gallery/${id}/edit`;

/** The address of one post's edit screen. */
export const blogEditPath = (id: number): string => `/admin/blog/${id}/edit`;

/** The address of one tour's edit screen. */
export const tourEditPath = (id: number): string => `/admin/tours/${id}/edit`;

/** Every leaf string in `paths`, however deeply nested. */
type Leaves<T> = T extends string ? T : { [K in keyof T]: Leaves<T[K]> }[keyof T];

export type Path = Leaves<typeof paths>;
