#!/bin/bash
set -e

echo "🚀 Deployment started ..."

# Stop Tailscale Funnel
tailscale funnel reset

# Navigate to frontend directory
cd /var/www/elikas-frontend

# Install production dependencies
/root/.nvm/versions/node/v24.17.0/bin/npm ci 

# Build app
/root/.nvm/versions/node/v24.17.0/bin/npm run build

# Reload 
echo "🔄 Getting eLikas PWA online ..."
tailscale funnel --bg 80

echo "✅ Deployment finished successfully!"
