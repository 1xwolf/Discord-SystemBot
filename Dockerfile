FROM node:18-alpine
RUN apk add --no-cache \
    cairo-dev pango-dev libjpeg-turbo-dev giflib-dev \
    python3 make g++ pkgconfig
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "index.js"]
