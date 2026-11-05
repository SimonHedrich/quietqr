# syntax=docker/dockerfile:1

# Build stage: runs on the build machine's platform; the output is plain static files.
FROM --platform=$BUILDPLATFORM node:26-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY . .
RUN npm run build

# Runtime: static-web-server on scratch, a few MB.
FROM joseluisq/static-web-server:2.44.1
COPY --from=build /app/dist /public
COPY docker/sws.toml /etc/sws.toml
ENV SERVER_CONFIG_FILE=/etc/sws.toml
USER 65534:65534
EXPOSE 8080
