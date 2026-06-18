#!/bin/bash
set -e

echo "🚀 Deployment started ..."

# Stop Tailscale Funnel
tailscale funnel reset

# Navigate to frontend directory
cd /var/www/elikas-frontend

# Install production dependencies
npm ci 

# Build app
npm run build

# Reload 
echo "🔄 Getting eLikas PWA online ..."
tailscale funnel --bg 80

echo "✅ Deployment finished successfully!"
