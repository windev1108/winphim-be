# ============================================================================
# Stage 1: Builder - Build ứng dụng với Bun
# ============================================================================
FROM oven/bun:latest AS builder

WORKDIR /app

# Copy package files và lock file
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build ứng dụng
RUN bun run build

# ============================================================================
# Stage 2: Production - Runtime image
# ============================================================================
FROM node:20-alpine

WORKDIR /app

# Install dumb-init để xử lý signals đúng cách (graceful shutdown)
RUN apk add --no-cache dumb-init

# Copy package files
COPY package.json .

# Install production dependencies với npm (lightweight)
RUN npm install --omit=dev --no-save

# Copy built application từ builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user cho bảo mật
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Expose port
EXPOSE 3000

# Sử dụng dumb-init để run application
ENTRYPOINT ["dumb-init", "--"]

# Run ứng dụng
CMD ["node", "dist/main.js"]

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (res) => {if (res.statusCode !== 200) throw new Error(res.statusCode)})"

# Sử dụng dumb-init để quản lý process
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "--max-old-space-size=256", "dist/main.js"]
