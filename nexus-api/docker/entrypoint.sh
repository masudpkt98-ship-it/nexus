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

# Ensure the admin account exists (idempotent, no demo data). Set ADMIN_PASSWORD.
echo "🌱 Ensuring admin account (ProductionSeeder)..."
php artisan db:seed --class=ProductionSeeder --force

php artisan config:cache

# Listen on the platform-assigned $PORT (Railway/Render inject it); 8000 locally.
PORT="${PORT:-8000}"
echo "🚀 NEXUS API listening on 0.0.0.0:${PORT}"
exec php artisan serve --host=0.0.0.0 --port="${PORT}"
