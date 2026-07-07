#!/usr/bin/env bash
set -e

# Generate an ephemeral APP_KEY if none is supplied (set APP_KEY for a stable one).
if [ -z "${APP_KEY:-}" ]; then
  export APP_KEY="$(php artisan key:generate --show)"
  echo "🔑 No APP_KEY provided — generated an ephemeral one for this run."
fi

echo "⏳ Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
until php -r "try { new PDO('pgsql:host=${DB_HOST};port=${DB_PORT};dbname=${DB_DATABASE}', '${DB_USERNAME}', '${DB_PASSWORD}'); exit(0); } catch (Throwable \$e) { exit(1); }"; do
  sleep 2
done
echo "✅ PostgreSQL is up."

echo "▶️  Running migrations..."
php artisan migrate --force

# Seed only when the database is empty (preserves data across restarts).
if php -r "\$p = new PDO('pgsql:host=${DB_HOST};port=${DB_PORT};dbname=${DB_DATABASE}', '${DB_USERNAME}', '${DB_PASSWORD}'); \$n = (int) \$p->query('select count(*) from users')->fetchColumn(); exit(\$n > 0 ? 0 : 1);"; then
  echo "ℹ️  Database already seeded — skipping."
else
  echo "🌱 Seeding demo data..."
  php artisan db:seed --force
fi

# Ensure writable runtime dirs exist (their contents are excluded from the image).
mkdir -p storage/framework/views storage/framework/cache storage/framework/sessions storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# Cache config & views for production. (Routes use closures, so route:cache is skipped.)
php artisan config:cache
php artisan view:cache

echo "🚀 NEXUS API (nginx + php-fpm) listening on :80"
exec supervisord -c docker/supervisord.conf
