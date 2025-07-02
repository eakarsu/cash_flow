# Use Node.js runtime
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

RUN npm run build
RUN npm run build:server

# Install serve for static frontend
RUN npm install -g serve

# Install concurrently for running both servers
RUN npm install -g concurrently

# Add local node_modules binaries to PATH
ENV PATH=/app/node_modules/.bin:$PATH

CMD ["concurrently", "node dist/server.js", "serve -s build -l 3000"]
