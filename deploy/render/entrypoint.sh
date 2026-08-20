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

# Seeding.
#
# Both switches are off by default and are meant to be turned on for one deploy,
# confirmed in the log, then turned off again. Leaving either on re-applies the
# seeded values on every restart — including the ones a free instance performs by
# itself when it wakes from spin-down — so anything an editor changed through the
# admin panel would silently revert to the seeded copy.
#
# Every seeder is idempotent by design: they are fixed reference sets, not sample
# data, so they updateOrCreate (or, for the two singletons, load the first row and
# overwrite it) rather than inserting duplicates.
#
#   SEED_ADMIN=true    just the administrator account.
#   SEED_CONTENT=true  everything: admin, site settings, hero banners, the
#                      who-we-are and why-us sections, feedback, gallery and blog
#                      posts. This is what fills an empty production site.
#
# SEED_CONTENT already includes the administrator (DatabaseSeeder calls
# AdminUserSeeder first), so there is no reason to set both.
#
# This must run BEFORE config:cache. AdminUserSeeder reads ADMIN_EMAIL and
# ADMIN_PASSWORD through env(), which returns null once configuration is cached —
# so seeding afterwards would quietly create admin@50voyagers.com with the
# password "password" instead of the credentials you set.
#
# Single quotes around --class: the shell would otherwise eat the namespace
# separators and hand artisan the class "DatabaseSeedersAdminUserSeeder".
if [ "${SEED_CONTENT:-false}" = "true" ]; then
    echo "==> Seeding all content (admin, settings, banners, gallery, blog)"
    CACHE_STORE=file php artisan db:seed --force --class='Database\Seeders\DatabaseSeeder'
elif [ "${SEED_ADMIN:-false}" = "true" ]; then
    echo "==> Seeding administrator"
    CACHE_STORE=file php artisan db:seed --force --class='Database\Seeders\AdminUserSeeder'
fi

# Config and route caches. Built at start rather than baked into the image
# because config:cache freezes environment variables into a PHP file, and the
# environment is only complete once Render injects it.
#
# There is deliberately no `view:cache`. This application ships no Blade views —
# routes/web.php answers JSON and Next owns the document — so there is no
# resources/views directory, and view:cache fails on the missing path rather
# than no-opping.
php artisan config:cache
php artisan route:cache

exec "$@"
