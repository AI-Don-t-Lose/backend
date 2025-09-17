FROM node:22 AS development

WORKDIR /usr/src/app

COPY package.json .
COPY pnpm-lock.yaml .

# install pnpm
RUN npm install -g pnpm

RUN pnpm install

COPY . .

RUN pnpm prisma generate

RUN pnpm build

RUN pnpm install --prod

FROM node:22-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY --from=development /usr/src/app/node_modules ./node_modules
COPY --from=development /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]