/**
 * Lifts the first-paint cloak added by the inline script in `app.blade.php`.
 *
 * Deliberately its own module with no dependencies: both the marketing motion
 * layer and the admin panel need it, and the admin panel must not pull GSAP
 * into its bundle just to release a CSS class.
 */
export function releaseBootCloak(): void {
    document.documentElement.classList.remove('voy-boot');
}
