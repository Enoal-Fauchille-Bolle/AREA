# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY web-client/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY web-client/ .

# Build the application
RUN npm run build

# Start the application
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]

# Serve stage
FROM nginx:stable-alpine

# Copy React app build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY web-client/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for Docker (mapped to 8081 in docker-compose)
EXPOSE 80
