# ==========================================
# Stage 1: Build the application
# ==========================================
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and yarn.lock first to leverage Docker cache
COPY package.json yarn.lock ./

# Install dependencies using yarn
RUN yarn install --frozen-lockfile

# Copy the rest of the application files
COPY . .

# Build the Vite project for production (outputs to /app/dist by default)
RUN yarn build

# ==========================================
# Stage 2: Serve the application with Nginx
# ==========================================
FROM nginx:alpine

# Remove the default Nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom configuration
COPY nginx.conf /etc/nginx/conf.d/

# Copy the built static files
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]