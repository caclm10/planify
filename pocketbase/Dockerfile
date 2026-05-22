FROM alpine:latest

# Install dependencies (ca-certificates for HTTPS, unzip to extract)
RUN apk add --no-cache ca-certificates unzip wget

# Set PocketBase version matching local installation
ENV PB_VERSION=0.38.1

# Download and unzip PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/ && \
    rm /tmp/pb.zip

# Copy migrations so database schema is automatically created/updated on start
COPY ./pb_migrations /pb/pb_migrations

# Expose standard port
EXPOSE 8080

# Start PocketBase with persistent data directory at /pb/pb_data
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080", "--dir=/pb/pb_data"]
