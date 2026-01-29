# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Create a non-root user
RUN addgroup -S sveltekit && adduser -S sveltekit -G sveltekit

# Copy built application from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy static assets
COPY --from=builder /app/static ./static

# Set ownership
RUN chown -R sveltekit:sveltekit /app

# Switch to non-root user
USER sveltekit

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["node", "build"]
