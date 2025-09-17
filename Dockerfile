# Dockerfile pour déployer la démo Docker sur Render
FROM node:18-alpine

# Installation des outils système nécessaires
RUN apk add --no-cache \
    curl \
    bash \
    python3 \
    py3-pip \
    nginx

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Répertoire de travail
WORKDIR /app

# Créer la structure de répertoires
RUN mkdir -p /app/public /app/logs /app/data /var/log/nginx

# Copier les fichiers de l'application
COPY package.json ./
COPY server.js ./
COPY public/ ./public/

# Installation des dépendances Node.js
RUN npm install --production

# Configuration Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Script d'entrée
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

# Ajuster les permissions
RUN chown -R appuser:appgroup /app /var/log/nginx /var/lib/nginx /var/run

# Exposer le port
EXPOSE 3000

# Utiliser l'utilisateur non-root
USER appuser

# Point d'entrée
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]