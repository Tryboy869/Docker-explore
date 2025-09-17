#!/bin/bash

# Script d'entrée pour l'application Docker Demo sur Render
set -e

echo "🐳 Starting Docker Advanced Capabilities Demo"
echo "Environment: ${NODE_ENV:-production}"
echo "Port: ${PORT:-3000}"

# Créer les répertoires nécessaires
mkdir -p /app/logs /app/data

# Vérifier que les fichiers nécessaires existent
if [ ! -f "/app/server.js" ]; then
    echo "❌ server.js not found!"
    exit 1
fi

if [ ! -f "/app/public/index.html" ]; then
    echo "❌ index.html not found!"
    exit 1
fi

# Afficher les informations système
echo "📋 System Information:"
echo "  Node.js version: $(node --version)"
echo "  NPM version: $(npm --version)"
echo "  Platform: $(uname -s)"
echo "  Architecture: $(uname -m)"
echo "  Memory available: $(free -h | awk '/^Mem:/ {print $2}' 2>/dev/null || echo 'N/A')"

# Vérifier la connectivité réseau
echo "🌐 Network connectivity check..."
if curl -s --max-time 5 https://httpbin.org/ip > /dev/null; then
    echo "  ✅ Internet connectivity: OK"
else
    echo "  ⚠️ Limited internet connectivity"
fi

# Simuler la présence de Docker (pour la démo)
echo "🐳 Docker Environment Simulation:"
echo "  Docker Engine: v24.0.7 (simulated)"
echo "  Containerd: v1.6.24 (simulated)"
echo "  Runc: v1.1.9 (simulated)"
echo "  Init containers: 3 (simulated)"
echo "  Base images: 2 (simulated)"
echo "  Default network: bridge (simulated)"

# Démarrer l'application
echo "🚀 Starting Docker Demo Server..."
exec node server.js
