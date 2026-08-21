import 'server-only';

/**
 * Where this server reaches Laravel.
 *
 * Reached directly rather than through this application's own origin: a server
 * calling itself to reach a proxy to somewhere else is a hop that can only fail.
 *
 * Every caller appends a path that already begins with `/`, so the trailing
 * slash has to come off here. An origin copied out of a browser's address bar
 * keeps that slash, and the result is `https://host//api/site/home` — a leading
 * double slash Laravel matches no route for. The fetch 404s, the caller's catch
 * swallows it, and the page renders its built-in fallback content instead of
 * what an editor actually published. Nothing looks broken, which is precisely
 * why it is worth normalising rather than trusting the value to arrive clean.
 *
 * Blank counts as absent for a related reason: a hosting dashboard will happily
 * store a variable with an empty value, and `??` alone would let `''` through to
 * become a relative URL.
 *
 * `next.config.ts` normalises the same variable for the rewrite proxy. It cannot
 * import this module — it is not part of the compiled application — so the rule
 * is stated in both places and must stay in step.
 */
export const laravelOrigin = (
    process.env.LARAVEL_ORIGIN?.trim() || 'http://127.0.0.1:8000'
).replace(/\/+$/, '');
