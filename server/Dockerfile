# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies (including dev)
COPY package*.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript code
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy generated Prisma Client
COPY --from=builder /app/src/database/generated/prisma ./src/database/generated/prisma
COPY --from=builder /app/src/database/generated/prisma ./dist/database/generated/prisma
# Also copy schema in case it's needed by prisma runtime
COPY --from=builder /app/src/database/prisma ./src/database/prisma

# Copy built application
COPY --from=builder /app/dist ./dist

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]
