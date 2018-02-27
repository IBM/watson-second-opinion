FROM node:8.9.4-alpine

COPY app.js /app/
COPY package.json /app/
COPY lib /app/lib
COPY public /app/public

WORKDIR /app
RUN npm install

CMD ["node", "app.js"]