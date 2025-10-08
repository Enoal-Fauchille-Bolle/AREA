# Use official Node.js image as base
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY application-server/package*.json ./

# Install dependencies (include devDependencies so TypeScript is available for build)
RUN npm install

# Copy source code
COPY application-server/ .

# Build the application
RUN npm run build

# Remove devDependencies to keep the final image smaller
RUN npm prune --omit=dev

# Expose port
EXPOSE ${PORT}

# Copy entrypoint and make it executable
COPY application-server/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Start with entrypoint (runs migrations then app)
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
