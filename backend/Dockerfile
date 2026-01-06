# Multi-stage build for smaller image size using Alpine Linux optimized node image
FROM node:20-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm install

# Copy source code
COPY . .

# Build the TypeScript code
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine

WORKDIR /app

# Copy package files again
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy built artifacts from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the API port
EXPOSE 5001

# Set Node environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/server.js"]
