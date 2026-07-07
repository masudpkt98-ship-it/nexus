#!/usr/bin/env bash
set -e

# Generate an ephemeral APP_KEY when none is supplied, so no key literal needs to
# live in the repo. Set APP_KEY in your environment/.env for a stable key that
# survives restarts (required if you rely on persistent encrypted data/sessions).
if [ -z "${APP_KEY:-}" ]; then
  export APP_KEY="$(php artisan key:generate --show)"
  echo "🔑 No APP_KEY provided — generated an ephemeral one for this run."
fi

echo "⏳ Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
until php -r "try { new PDO('pgsql:host=${DB_HOST};port=${DB_PORT};dbname=${DB_DATABASE}', '${DB_USERNAME}', '${DB_PASSWORD}'); exit(0); } catch (Throwable \$e) { exit(1); }"; do
  sleep 2
done
echo "✅ PostgreSQL is up."

php artisan config:clear

echo "▶️  Running migrations..."
php artisan migrate --force

# Seed only when the database is empty (preserves data across restarts).
if php -r "\$p = new PDO('pgsql:host=${DB_HOST};port=${DB_PORT};dbname=${DB_DATABASE}', '${DB_USERNAME}', '${DB_PASSWORD}'); \$n = (int) \$p->query('select count(*) from users')->fetchColumn(); exit(\$n > 0 ? 0 : 1);"; then
  echo "ℹ️  Database already seeded — skipping."
else
  echo "🌱 Seeding demo data..."
  php artisan db:seed --force
fi

echo "🚀 NEXUS API listening on 0.0.0.0:8000"
exec php artisan serve --host=0.0.0.0 --port=8000
