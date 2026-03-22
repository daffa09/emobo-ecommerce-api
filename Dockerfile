# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and prisma schema first for better caching
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the source code
COPY . .

# Build the project
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine

# Install openssl for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy build artifacts from builder stage
COPY --from=builder /app/dist ./dist
# Prisma client needs the generated files
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Create uploads directory for image storage
RUN mkdir -p uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose the port the app runs on
EXPOSE 5000

# Run the app
CMD ["npm", "start"]
