# Backend Dockerfile for Student Attendance Management System
FROM node:20-alpine

# Install curl for health check
RUN apk add --no-cache curl

WORKDIR /app

# Install dependencies first for Docker cache optimization
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Ensure uploads directories exist
RUN mkdir -p uploads/profiles uploads/attendance

# Expose backend REST API port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the Node.js server
CMD ["node", "server.js"]

