# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /usr/src/app

RUN npm install -g pnpm@10

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Stage 2: Runtime
FROM node:22-alpine
WORKDIR /usr/src/app

RUN apk add --no-cache ffmpeg
RUN npm install -g pnpm@10

COPY --from=builder /usr/src/app/dist ./dist
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --prod --frozen-lockfile

CMD ["node", "dist/main.js"]
