# Laravel on Render.
#
# Render has no native PHP runtime — Node, Python, Ruby, Go, Rust and Elixir are
# the whole list — so the PHP half of this application ships as a container while
# the front end uses the native Node runtime. This is the only part of the deploy
# that needs Docker.
#
# One process per container: php-fpm behind nginx, both under supervisord. The
# same image backs the web service, the queue worker and the cron job; the start
# command is what differs between them.

FROM php:8.3-fpm-bookworm

# libpq-dev is what makes pdo_pgsql compile; the rest are for intervention/image
# (GD with JPEG/PNG/WebP) and for composer unzipping packages.
RUN apt-get update && apt-get install -y --no-install-recommends \
        nginx \
        supervisor \
        gettext-base \
        libpq-dev \
        libzip-dev \
        libpng-dev \
        libjpeg62-turbo-dev \
        libfreetype6-dev \
        libwebp-dev \
        unzip \
        git \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_pgsql \
        pgsql \
        gd \
        zip \
        bcmath \
        opcache \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Pinned rather than `composer:2`. The floating tag moved to 2.10, which flipped
# `source-fallback` to false and turned a rate-limited GitHub zipball into a hard
# build failure. Pinning keeps the resolver behaviour identical between here and
# the lockfile, which was written by 2.9 (plugin-api-version 2.9.0).
COPY --from=composer:2.9 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Dependencies first, so a change to application code does not re-resolve the
# whole tree on every deploy. `--no-scripts` because the post-install hooks run
# artisan, and artisan cannot boot before the application code is copied in.
COPY composer.json composer.lock ./

# Render builds from shared IP addresses, so unauthenticated requests to
# api.github.com — where Composer fetches every dist zipball — hit GitHub's rate
# limit and come back as HTTP 504. Three defences, in the order they take effect:
#
#   1. retries. A 504 is transient, so simply trying again usually clears it and
#      avoids the slower paths below entirely.
#   2. source-fallback. Lets Composer clone from git when a dist download fails.
#      Composer 2.10 deprecated this and defaults it to false — the reason the
#      build died with "Source fallback is disabled. Not trying alternative
#      sources." rather than recovering. Harmless on 2.9, which does not know
#      the key, hence the `|| true`.
#   3. --prefer-source on the last attempt, which skips the zipballs altogether.
#
# The packages here are all public, so the supply-chain concern behind 2.10's
# new default does not apply.
ENV COMPOSER_PROCESS_TIMEOUT=600 \
    COMPOSER_NO_INTERACTION=1

# Optional, and the single most effective fix if the retries above still lose:
# a GitHub token lifts the API limit from 60 requests/hour for the whole shared
# build IP to 5,000/hour for you alone. Set GITHUB_TOKEN in Render as a build-time
# secret — a fine-grained token with NO permissions at all is enough, since every
# package here is public and the token is only proving you are not anonymous.
ARG GITHUB_TOKEN=""

RUN set -eux; \
    composer config --global process-timeout 600; \
    composer config --global source-fallback true 2>/dev/null || true; \
    if [ -n "$GITHUB_TOKEN" ]; then \
        echo "==> authenticating to github.com"; \
        composer config --global --auth github-oauth.github.com "$GITHUB_TOKEN"; \
    fi; \
    for attempt in 1 2 3; do \
        echo "==> composer install (attempt $attempt/3)"; \
        if composer install \
                --no-dev \
                --no-interaction \
                --prefer-dist \
                --no-progress \
                --no-scripts \
                --no-autoloader; then \
            echo "==> composer install succeeded"; \
            break; \
        fi; \
        if [ "$attempt" = "3" ]; then \
            echo "==> dist downloads still failing; falling back to source"; \
            composer install \
                --no-dev \
                --no-interaction \
                --prefer-source \
                --no-progress \
                --no-scripts \
                --no-autoloader; \
        else \
            echo "==> retrying in 15s"; \
            sleep 15; \
        fi; \
    done; \
    # Same layer as the write, or the token survives in the image even though a
    # later `rm` appears to remove it: every layer is independently readable.
    rm -f /root/.composer/auth.json /root/.config/composer/auth.json

COPY . .

RUN composer dump-autoload --optimize --classmap-authoritative \
    && php artisan package:discover --ansi

# Laravel needs to write here; nginx and php-fpm both run as www-data.
RUN mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

COPY deploy/render/nginx.conf /etc/nginx/sites-available/default
COPY deploy/render/php.ini /usr/local/etc/php/conf.d/zz-app.ini
COPY deploy/render/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY deploy/render/entrypoint.sh /usr/local/bin/entrypoint

# The base image's php-fpm pool listens on a Unix socket; nginx.conf talks to it
# over TCP. Pin the pool to 127.0.0.1:9000 so the two agree, and stop php-fpm
# clearing the environment — Render's variables arrive through it, and
# `clear_env=yes` (the default) would hide every one of them from the workers.
RUN sed -i 's|^listen = .*|listen = 127.0.0.1:9000|' /usr/local/etc/php-fpm.d/www.conf \
    && printf '\nclear_env = no\n' >> /usr/local/etc/php-fpm.d/www.conf \
    # `default` is only served if it is enabled; the Debian nginx package ships
    # its own placeholder site that would otherwise answer first.
    && rm -f /etc/nginx/sites-enabled/default \
    && chmod +x /usr/local/bin/entrypoint

# Render injects PORT and expects the service to listen on it. nginx.conf reads
# it at start time through envsubst — see the entrypoint.
ENV PORT=8000

EXPOSE 8000

ENTRYPOINT ["/usr/local/bin/entrypoint"]
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
