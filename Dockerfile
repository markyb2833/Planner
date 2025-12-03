# Multi-stage Dockerfile for Planner Application

# Stage 1: Backend
FROM node:18-alpine AS backend

WORKDIR /app

# Copy backend package files
COPY package*.json ./

# Install backend dependencies
RUN npm install

# Copy backend source
COPY server ./server
COPY setup_database.js ./
COPY database_schema.sql ./
COPY .env ./

# Stage 2: Frontend Build
FROM node:18-alpine AS frontend-build

WORKDIR /app

# Copy frontend package files (will be created)
COPY client/package*.json ./client/

# Install frontend dependencies
WORKDIR /app/client
RUN npm install

# Copy frontend source
COPY client ./

# Build frontend for production
RUN npm run build

# Stage 3: Production
FROM node:18-alpine

WORKDIR /app

# Copy backend dependencies and code
COPY --from=backend /app/node_modules ./node_modules
COPY --from=backend /app/package*.json ./
COPY --from=backend /app/server ./server
COPY --from=backend /app/setup_database.js ./
COPY --from=backend /app/database_schema.sql ./
COPY --from=backend /app/.env ./

# Copy built frontend
COPY --from=frontend-build /app/client/build ./client/build

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "server/index.js"]
