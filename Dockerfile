# Multi-stage Dockerfile for lightweight and secure production image
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# --- Production Image ---
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV APP_PORT=3000

# Security: Jalankan container dengan non-root user bawaan node
USER node

# Copy dependencies dari builder stage
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
# Copy source code aplikasi
COPY --chown=node:node . .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "src/index.js"]
