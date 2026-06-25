#!/bin/bash
set -e

echo "🚀 Deployment started ..."

# Stop Tailscale Funnel
echo "🛑 Pausing Tailscale Funnel..."
sudo /usr/bin/tailscale funnel reset

# Navigate to frontend directory
cd /var/www/elikas-frontend

# Install production dependencies
echo "📦 Installing frontend dependencies..."
/root/.nvm/versions/node/v24.17.0/bin/npm ci 

# Build app
echo "🏗️  Compiling production build assets..."
/root/.nvm/versions/node/v24.17.0/bin/npm run build

# Reload 
echo "🔄 Getting eLikas PWA back online ..."
sudo /usr/bin/tailscale funnel --bg 80

echo "✅ Deployment finished successfully!"
