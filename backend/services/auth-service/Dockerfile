FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first for caching
COPY package*.json ./
RUN npm ci --only=production

# Copy shared libraries
COPY ../../shared ./shared

# Copy service code
COPY . .

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start server
CMD ["node", "src/server.js"]
