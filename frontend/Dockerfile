# Stage 1: Build the React Application
FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build time environment variables
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_SOCKET_URL=""
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

# Build the app to "dist" folder
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Install openssl for self-signed certificates
RUN apk add --no-cache openssl

# Copy the build output to Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# SSL Certificate Generation
COPY generate-certs.sh /usr/local/bin/generate-certs.sh
RUN chmod +x /usr/local/bin/generate-certs.sh

# Expose port 80 and 443
EXPOSE 80 443

# Entrypoint to generate certs and start Nginx
ENTRYPOINT ["/usr/local/bin/generate-certs.sh"]
CMD ["nginx", "-g", "daemon off;"]
