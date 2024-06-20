FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

ENV PORT 3000

ENV NODE_ENV=production

# run the app when container launches
CMD ["node", "index.js"]
