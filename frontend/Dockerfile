# Multi-stage Dockerfile for React frontend
# Stage 1: Build - Node 20 build environment
FROM node:20-alpine AS builder

WORKDIR /app

# Copy the local design system dependency
# Context is assumed to be project root as per docker-compose.yml
COPY design-system /design-system

# Build design system if needed (or at least provide it for npm install)
# We run npm install inside design-system to ensure it's available
RUN cd /design-system && npm install && npm run build

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies (linked to the /design-system)
RUN npm install --legacy-peer-deps

# Copy frontend source code
COPY frontend/ ./

# Build the React app
RUN npm run build

# Stage 2: Serve - Nginx Alpine
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
