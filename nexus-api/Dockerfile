# ---- NEXUS API (Laravel) ----
FROM php:8.4-cli

# Robust PHP extension installer (handles pdo_pgsql, redis, etc. reliably)
COPY --from=mlocati/php-extension-installer:latest /usr/bin/install-php-extensions /usr/local/bin/

RUN apt-get update \
    && apt-get install -y --no-install-recommends unzip git \
    && install-php-extensions pdo_pgsql redis mbstring bcmath zip gd \
    && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Install PHP dependencies first (better layer caching)
COPY composer.json composer.lock ./
RUN composer install --no-interaction --no-scripts --prefer-dist --optimize-autoloader --no-dev

# App source
COPY . .
RUN composer dump-autoload --optimize --no-dev \
    && chmod +x docker/entrypoint.sh \
    && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 8000

ENTRYPOINT ["docker/entrypoint.sh"]
