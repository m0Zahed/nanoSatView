FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_AUTH_BASE_URL
ARG VITE_REQUIREMENTS_BASE_URL
ARG VITE_DOCUMENT_PROCESSOR_BASE_URL
ARG VITE_COMPONENTS_API_BASE_URL
ARG TESTING_REMOTE_LAN
ENV VITE_AUTH_BASE_URL=$VITE_AUTH_BASE_URL
ENV VITE_REQUIREMENTS_BASE_URL=$VITE_REQUIREMENTS_BASE_URL
ENV VITE_DOCUMENT_PROCESSOR_BASE_URL=$VITE_DOCUMENT_PROCESSOR_BASE_URL
ENV VITE_COMPONENTS_API_BASE_URL=$VITE_COMPONENTS_API_BASE_URL
ENV TESTING_REMOTE_LAN=$TESTING_REMOTE_LAN
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN NODE_OPTIONS=--max-old-space-size=2048
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/vite.config.ts ./vite.config.ts
COPY --from=build /app/dist ./dist
EXPOSE 5173
CMD ["npm", "run", "preview"]
