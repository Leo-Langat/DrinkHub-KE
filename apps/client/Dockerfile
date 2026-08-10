# Multi-Stage Build for Client Vite PWA
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/client ./apps/client

RUN npm ci
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/client

# Nginx Static File Serving Stage
FROM nginx:alpine AS runner

COPY --from=builder /app/apps/client/dist /usr/share/nginx/html
COPY docker/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
