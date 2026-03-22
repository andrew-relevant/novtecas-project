FROM node:20-alpine

WORKDIR /opt/app

COPY package.json package-lock.json* ./

EXPOSE 3000

CMD ["sh", "-c", "npm install && npm run dev"]
