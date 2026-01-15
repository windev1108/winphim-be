# Stage 1: Dependencies
FROM node:20-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

RUN npm ci --legacy-peer-deps


# Stage 2: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --legacy-peer-deps

COPY . .

RUN npm run build

# Cleanup
RUN rm -rf node_modules


# Stage 3: Production
FROM node:20-alpine

WORKDIR /app

# Install dumb-init để handle signals đúng cách
RUN apk add --no-cache dumb-init

# Copy dependencies từ stage 1
COPY --from=dependencies /app/node_modules ./node_modules

# Copy package files
COPY package*.json ./

# Copy built application từ stage 2
COPY --from=builder /app/dist ./dist

# Create non-root user cho security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (res) => {if (res.statusCode !== 200) throw new Error(res.statusCode)})"

# Sử dụng dumb-init để quản lý process
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "--max-old-space-size=256", "dist/main.js"]
