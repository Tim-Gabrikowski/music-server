FROM ubuntu:latest
USER root
WORKDIR /app

RUN apt-get update
RUN apt-get -y install ca-certificates curl gnupg ffmpeg
RUN mkdir -p /etc/apt/keyrings 
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
RUN apt-get update
RUN apt-get -y install nodejs

COPY package*.json ./

RUN npm install

COPY . .

ENV SERVER_PORT=3010

EXPOSE 3010

CMD ["npm", "start"]