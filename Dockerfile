FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --no-audit --no-fund

COPY . .

RUN npm run build

EXPOSE 3333

CMD ["node", "build/server.js"]
