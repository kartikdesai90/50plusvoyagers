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

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Dependencies first, so a change to application code does not re-resolve the
# whole tree on every deploy. `--no-scripts` because the post-install hooks run
# artisan, and artisan cannot boot before the application code is copied in.
COPY composer.json composer.lock ./
RUN composer install \
        --no-dev \
        --no-interaction \
        --prefer-dist \
        --no-progress \
        --no-scripts \
        --no-autoloader

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
