#!/bin/bash
set -e

echo "🚀 Deployment started ..."

# Enter maintenance mode so users don't hit errors mid-update
echo "🚧 Entering maintenance mode..."
(/var/www/eLikas_backend/php artisan down) || true

# Navigate to backend directory
cd /var/www/elikas-capstone/eLikas_backend

# Install production dependencies
echo "📦 Installing production dependencies..."
composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

# Clear old caches and optimize configuration/routes
echo "⚡ Optimizing application caches..."
php artisan optimize
php artisan view:cache

# Refresh queue workers to pick up new code changes
echo "🔄 Restarting background queue workers..."
php artisan queue:restart

# Reload PHP-FPM to flush OPcache (crucial for Debian/Ubuntu servers to see changes instantly)
echo "🔄 Reloading PHP-FPM..."
sudo systemctl restart php8.5-fpm

# Exit maintenance mode
echo "✨ Bringing API back online..."
php artisan up

echo "✅ Deployment finished successfully!"
