/**
 * Tailwind v4 runs as a PostCSS plugin here rather than the Vite plugin the
 * old build used. Same Tailwind, same stylesheet, different host.
 */
const config = {
    plugins: {
        '@tailwindcss/postcss': {},
    },
};

export default config;
