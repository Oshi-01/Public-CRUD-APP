# Use Node.js LTS version
FROM node:18-alpine

# Set working directory for the entire app
WORKDIR /app

# Copy package files (both package.json and package-lock.json)
COPY server/package.json ./server/
COPY server/package-lock.json ./server/

# Install dependencies
WORKDIR /app/server
RUN npm ci --omit=dev

# Copy server files
COPY server/ ./

# Copy public files (server.js uses path.join(__dirname, '..', 'public'))
# So if server.js is at /app/server/server.js, public should be at /app/public
WORKDIR /app
COPY public/ ./public/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Set working directory back to server for running
WORKDIR /app/server

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "server.js"]
