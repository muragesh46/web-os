# Multi-stage build for Web OS

# Backend build stage
FROM node:24-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production

# Frontend build stage
FROM node:24-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps
COPY frontend ./
RUN npm run build

# Production stage
FROM node:24-alpine
WORKDIR /app

# Install backend dependencies
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY backend ./backend

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose ports
EXPOSE 3001 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start backend
CMD ["node", "backend/src/app.js"]
