# Step 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency configs
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy codebase
COPY . .

# Compile TypeScript and build production bundle
RUN npm run build

# Step 2: Serve stage
FROM nginx:stable-alpine

# Copy nginx config file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose Nginx port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
