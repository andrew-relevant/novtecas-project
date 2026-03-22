FROM node:20-alpine

RUN apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev

WORKDIR /opt/app

COPY package.json package-lock.json* ./

EXPOSE 1337

CMD ["sh", "-c", "npm install --legacy-peer-deps && npm run develop"]
