FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

# install ignore peer deps để không lỗi swagger
RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build


# ----------------------------
# Production image
# ----------------------------
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# chỉ lấy deps production
RUN npm install --omit=dev --legacy-peer-deps

COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["node", "dist/main.js"]
