#!/bin/bash
set -e

echo "🚀 Deployment started ..."

# Stop Tailscale Funnel
sudo tailscale funnel reset

# Navigate to repository directory
cd /var/www/elikas-capstone

# Securely overwrite tracking files with the latest deployment branch
git fetch origin
git reset --hard origin/deployment

# Navigate to frontend directory
cd /var/www/elikas-frontend

# Install production dependencies
npm ci 

# Build app
npm run build

# Reload 
echo "🔄 Getting eLikas PWA online ..."
sudo tailscale funnel --bg 80

echo "✅ Deployment finished successfully!"
