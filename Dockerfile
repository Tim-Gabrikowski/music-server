FROM ubuntu:latest
USER root
WORKDIR /app

RUN apt-get update
RUN apt-get -y install curl gnupg ffmpeg
RUN curl -sL https://deb.nodesource.com/setup_16.x  | bash -
RUN apt-get -y install nodejs

COPY package*.json ./

RUN npm install

COPY . .

ENV SERVER_PORT=3010

EXPOSE 3010

CMD ["npm", "start"]