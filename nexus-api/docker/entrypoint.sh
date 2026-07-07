#!/usr/bin/env bash
set -e

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
