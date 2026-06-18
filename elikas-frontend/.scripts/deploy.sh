#!/bin/bash
set -e

echo "🚀 Deployment started ..."

# Stop Tailscale Funnel
sudo /usr/bin/tailscale funnel reset

# Navigate to frontend directory
cd /var/www/elikas-frontend

# Install production dependencies
/root/.nvm/versions/node/v24.17.0/bin/npm ci 

# Build app
/root/.nvm/versions/node/v24.17.0/bin/npm run build

# Reload 
echo "🔄 Getting eLikas PWA online ..."
sudo /usr/bin/tailscale funnel --bg 80

echo "✅ Deployment finished successfully!"