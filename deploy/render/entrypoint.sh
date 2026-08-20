#!/bin/sh
# Container start-up, shared by the web service, the worker and the cron job.
#
# Everything here is idempotent: Render runs this on every deploy, every restart
# and every time a free instance wakes from spin-down.

set -e

cd /var/www/html

# Render assigns the port at run time. nginx.conf carries a literal ${PORT}
# placeholder; substitute only that one variable so the $uri / $query_string
# nginx variables in the file survive untouched.
mkdir -p /etc/nginx/sites-enabled
envsubst '${PORT}' \
    < /etc/nginx/sites-available/default \
    > /etc/nginx/sites-enabled/default

# `php artisan storage:link` would fail on a re-deploy because the link is
# already there, so make it by hand and force it.
ln -sfn /var/www/html/storage/app/public /var/www/html/public/storage

chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

# Migrations, before the config cache is built.
#
# Render's `preDeployCommand` — the proper home for this — is a paid feature, so
# on the free plan the start command is the only hook available. `RUN_MIGRATIONS`
# gates it so that only the web service migrates: the worker and the cron job run
# this same image, and three containers racing to migrate the same database at
# once is how you get a half-applied schema.
#
# The lock is taken on the *file* cache rather than the configured database one.
# `--isolated` acquires its lock through the cache store, and the database store
# cannot serve a lock before the migration that creates the `cache` table has
# run — which is exactly the migration this performs on a fresh database. This
# has to happen before `config:cache`, because that bakes CACHE_STORE into a PHP
# file and an environment override would no longer be read.
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    echo "==> Running migrations"
    CACHE_STORE=file php artisan migrate --force --isolated
fi

# Config, route and view caches. Built at start rather than baked into the image
# because config:cache freezes environment variables into a PHP file, and the
# environment is only complete once Render injects it.
php artisan config:cache
php artisan route:cache
php artisan view:cache

exec "$@"
