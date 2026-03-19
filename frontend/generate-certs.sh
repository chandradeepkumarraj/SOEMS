#!/bin/sh

# Directory for SSL certificates
CERT_DIR="/etc/nginx/ssl"
mkdir -p $CERT_DIR

# Check if certificates already exist
if [ ! -f "$CERT_DIR/selfsigned.crt" ]; then
    echo "Generating self-signed SSL certificates for SOEMS..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$CERT_DIR/selfsigned.key" \
        -out "$CERT_DIR/selfsigned.crt" \
        -subj "/C=US/ST=State/L=City/O=SOEMS/OU=Development/CN=localhost"
    echo "SSL Certificate generation complete."
else
    echo "SSL Certificates already present. Skipping generation."
fi

# Execute CMD
exec "$@"
