
FROM node:22-alpine

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy backend source code
COPY src ./src

# Production environment
ENV NODE_ENV=production
ENV PORT=5000

# Backend port
EXPOSE 5000

# Start the Express server
CMD ["npm", "start"]
