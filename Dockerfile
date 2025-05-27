FROM node:22-bullseye

# Install MongoDB
RUN apt-get update && apt-get install -y gnupg curl \
 && curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-8.0.gpg \
 && echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/debian bullseye/mongodb-org/8.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-8.0.list \
 && apt-get update && apt-get install -y mongodb-org \
 && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /data/db /var/log && chown -R mongodb:mongodb /data/db

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 8082

CMD ["sh", "-c", "mongod --fork --logpath /var/log/mongod.log --dbpath /data/db && node app.js"]
