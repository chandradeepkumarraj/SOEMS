# Stage 1: Build the React Application
FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build time environment variables
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

# Build the app to "dist" folder
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy the build output to Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
