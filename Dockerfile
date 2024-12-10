FROM node:lts-alpine

WORKDIR /app

ADD package.json .
ADD package-lock.json .

RUN npm ci

ADD . .

RUN npm run build

CMD npm run start:prod

EXPOSE 3000