'use client';

import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from '@/shared/router';

import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useAdminAuth } from '@/admin/auth/auth-context';
import { normalizeError } from '@/shared/lib/api-error';
import { paths } from '@/routes/paths';

type FieldName = 'email' | 'password';
type FieldErrors = Partial<Record<FieldName, string>>;

function validate(email: string, password: string): FieldErrors {
    const errors: FieldErrors = {};

    if (!email.trim()) errors.email = 'Enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
        errors.email = 'Enter a valid email address.';

    if (!password) errors.password = 'Enter your password.';

    return errors;
}

export default function AdminLoginPage() {
    const { status, login } = useAdminAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const emailId = useId();
    const passwordId = useId();
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    /* Where ProtectedRoute wanted to send them before the redirect. */
    const from = (location.state as { from?: string } | null)?.from ?? paths.admin.dashboard;

    if (status === 'loading') {
        /* Inline, not a full-page splash — AdminAuthLayout already owns the shell. */
        return (
            <div
                className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground"
                role="status"
                aria-live="polite"
            >
                <Loader2
                    className="size-4 animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                />
                Checking your session…
            </div>
        );
    }

    if (status === 'authenticated') {
        return <Navigate to={from} replace />;
    }

    /*
     * Inputs are disabled while the request is in flight, and a disabled
     * element cannot take focus. Wait a frame so React has re-enabled them.
     */
    const focusSoon = (element: HTMLInputElement | null) => {
        if (!element) return;
        requestAnimationFrame(() => element.focus());
    };

    const focusFirstInvalid = (errors: FieldErrors) => {
        if (errors.email) focusSoon(emailRef.current);
        else if (errors.password) focusSoon(passwordRef.current);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isSubmitting) return;

        setFormError(null);

        const errors = validate(email, password);
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            focusFirstInvalid(errors);
            return;
        }

        setFieldErrors({});
        setIsSubmitting(true);

        try {
            await login({ email: email.trim(), password });
            void navigate(from, { replace: true });
        } catch (error) {
            const normalized = normalizeError(error);
            const serverFields: FieldErrors = {};

            for (const key of ['email', 'password'] as const) {
                const message = normalized.fieldErrors[key];
                /* Don't echo the banner text against a field as well. */
                if (message && message !== normalized.message) serverFields[key] = message;
            }

            setFieldErrors(serverFields);
            setFormError(normalized.message);

            if (Object.keys(serverFields).length > 0) {
                focusFirstInvalid(serverFields);
            } else {
                /*
                 * Form-level failure (wrong credentials, throttled). Blaming a
                 * single field would be a guess, so clear the password and put
                 * the cursor there for another attempt.
                 */
                setPassword('');
                focusSoon(passwordRef.current);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    /* Page chrome (theme, background, centring, wordmark) belongs to AdminAuthLayout. */
    return (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="mb-6">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">Sign in</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                    Enter your credentials to reach the admin panel.
                </p>
            </div>

            {formError ? (
                <Alert variant="destructive" className="mb-5">
                    <AlertCircle />
                    <AlertDescription>{formError}</AlertDescription>
                </Alert>
            ) : null}

            <form
                onSubmit={(event) => void handleSubmit(event)}
                noValidate
                className="flex flex-col gap-5"
            >
                <div className="flex flex-col gap-2">
                    <Label htmlFor={emailId}>Email address</Label>
                    <Input
                        id={emailId}
                        ref={emailRef}
                        type="email"
                        name="email"
                        autoComplete="username"
                        autoFocus
                        placeholder="you@example.com"
                        value={email}
                        disabled={isSubmitting}
                        aria-invalid={Boolean(fieldErrors.email)}
                        aria-describedby={fieldErrors.email ? `${emailId}-error` : undefined}
                        onChange={(event) => setEmail(event.target.value)}
                    />
                    {fieldErrors.email ? (
                        <p
                            id={`${emailId}-error`}
                            className="text-sm text-destructive"
                            role="alert"
                        >
                            {fieldErrors.email}
                        </p>
                    ) : null}
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor={passwordId}>Password</Label>
                    <div className="relative">
                        <Input
                            id={passwordId}
                            ref={passwordRef}
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            autoComplete="current-password"
                            placeholder="••••••••"
                            className="pr-11"
                            value={password}
                            disabled={isSubmitting}
                            aria-invalid={Boolean(fieldErrors.password)}
                            aria-describedby={
                                fieldErrors.password ? `${passwordId}-error` : undefined
                            }
                            onChange={(event) => setPassword(event.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((visible) => !visible)}
                            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/25"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            aria-pressed={showPassword}
                            tabIndex={isSubmitting ? -1 : 0}
                        >
                            {showPassword ? (
                                <EyeOff className="size-4" />
                            ) : (
                                <Eye className="size-4" />
                            )}
                        </button>
                    </div>
                    {fieldErrors.password ? (
                        <p
                            id={`${passwordId}-error`}
                            className="text-sm text-destructive"
                            role="alert"
                        >
                            {fieldErrors.password}
                        </p>
                    ) : null}
                </div>

                <Button type="submit" size="lg" className="mt-1 w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
                            Signing in…
                        </>
                    ) : (
                        'Sign in'
                    )}
                </Button>
            </form>

            {/*
             * There is deliberately no way out of this screen: no "create an
             * account" link, because staff accounts are seeded, and no recovery
             * link until password recovery is built.
             */}
        </div>
    );
}
