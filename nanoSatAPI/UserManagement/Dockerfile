FROM node:20 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm_config_build_from_source=1 npm ci --omit=dev \
  && npm_config_build_from_source=1 npm rebuild better-sqlite3

FROM node:20 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5000
CMD ["node", "index.js"]
