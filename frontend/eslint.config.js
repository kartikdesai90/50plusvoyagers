import js from '@eslint/js';
import next from 'eslint-config-next/core-web-vitals';
import configPrettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: ['node_modules', '.next', 'out', 'next-env.d.ts'],
    },
    {
        files: ['src/**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            ...tseslint.configs.recommendedTypeChecked,
            ...next,
            configPrettier,
        ],
        languageOptions: {
            ecmaVersion: 2022,
            globals: globals.browser,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            '@typescript-eslint/consistent-type-imports': [
                'error',
                { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
            ],
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],

            /*
             * Plain `<img>` stays.
             *
             * `next/image` would be an improvement to argue for on its own
             * merits, but it is not this change: it wraps every picture in a
             * sized container, rewrites the `src` through an optimiser and
             * changes the loading behaviour. The design here places images with
             * `object-fit` inside hand-tuned aspect boxes and the motion layer
             * animates several of them, so swapping the element is a visual
             * change, and this migration is not allowed to make one.
             *
             * The pictures are also served by Laravel, through a rewrite, which
             * the optimiser would need configuring for separately.
             */
            '@next/next/no-img-element': 'off',
        },
    },
    {
        /*
         * Area isolation, carried over unchanged from the Vite build.
         *
         * The two areas share the domain core and nothing else, and `shared`
         * must stay reachable from both, so it may import neither. This is what
         * keeps GSAP, Lenis and SplitType out of the bundle an editor
         * downloads, and Radix out of a public visitor's — the job the two Vite
         * entries used to do, now done by the route boundaries plus this rule.
         */
        files: ['src/site/**/*.{ts,tsx}', 'src/app/(site)/**/*.{ts,tsx}'],
        rules: {
            'no-restricted-imports': ['error', { patterns: ['@/admin/*', '**/admin/*'] }],
        },
    },
    {
        files: ['src/admin/**/*.{ts,tsx}', 'src/app/admin/**/*.{ts,tsx}'],
        rules: {
            'no-restricted-imports': ['error', { patterns: ['@/site/*', '**/site/*'] }],
        },
    },
    {
        /*
         * One pre-existing accessibility nit, quarantined rather than fixed.
         *
         * The select trigger is a Radix `button`, and the form marks an invalid
         * field with `aria-invalid` — which the button role does not support,
         * so the invalid state is not announced. That is worth fixing, and it
         * is worth fixing on its own: this migration is not allowed to change
         * how a screen behaves, and the rule only surfaced now because the old
         * config carried no accessibility plugin at all.
         *
         * Narrowed to the one file so the rule keeps working everywhere else.
         */
        files: ['src/admin/components/select-field.tsx'],
        rules: {
            'jsx-a11y/role-supports-aria-props': 'off',
        },
    },
    {
        files: ['src/shared/**/*.{ts,tsx}'],
        rules: {
            'no-restricted-imports': [
                'error',
                { patterns: ['@/site/*', '@/admin/*', '**/site/*', '**/admin/*'] },
            ],
        },
    },
    {
        files: ['*.js', '*.ts', '*.mjs'],
        extends: [js.configs.recommended, ...tseslint.configs.recommended, configPrettier],
        languageOptions: {
            globals: globals.node,
        },
    },
);
