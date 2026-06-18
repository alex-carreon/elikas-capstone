#!/bin/bash
set -e

echo "🚀 Deployment started ..."

# Enter maintenance mode so users don't hit errors mid-update
(/var/www/eLikas_backend/php artisan down) || true

# Navigate to backend directory
cd /var/www/elikas-capstone/eLikas_backend

# Install production dependencies
composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

# Recreate configuration and route caches for maximum performance
php artisan optimize
php artisan view:cache

# Reload PHP-FPM to flush OPcache (crucial for Debian/Ubuntu servers to see changes instantly)
echo "🔄 Reloading PHP-FPM..."
sudo systemctl restart php8.5-fpm

# Exit maintenance mode
php artisan up

echo "✅ Deployment finished successfully!"
