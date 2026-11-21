FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY tsconfig.json ./
COPY src ./src
COPY config ./config
COPY types ./types
COPY utils ./utils

USER node
EXPOSE 3000
CMD ["npm", "start"]
