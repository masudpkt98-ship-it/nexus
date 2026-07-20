# Laravel API — php-fpm (Caddy proxies to this via php_fastcgi). Build context nexus-api/.
FROM php:8.3-fpm-alpine

RUN apk add --no-cache libpq-dev icu-dev oniguruma-dev \
 && docker-php-ext-install pdo pdo_pgsql pdo_mysql mbstring bcmath intl opcache

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /srv/api
COPY . .
RUN composer install --no-dev --optimize-autoloader --no-interaction \
 && chown -R www-data:www-data storage bootstrap/cache

# Production caches are built at container start (after env is injected):
#   php artisan config:cache && route:cache && view:cache && migrate --force
COPY --chmod=0755 <<'SH' /usr/local/bin/entrypoint.sh
#!/bin/sh
set -e
php artisan config:cache
php artisan route:cache
php artisan migrate --force || true
exec php-fpm
SH

EXPOSE 9000
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
