FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY web/package.json web/
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build -w api && npm run build -w web

FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY web/package.json web/
RUN npm ci --omit=dev --workspace api

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app ./
COPY --from=build /app/api/dist ./api/dist
COPY --from=build /app/web/dist ./web/dist
USER node
EXPOSE 3000
CMD ["sh", "-c", "node api/dist/database/migrate.js && node api/dist/main.js"]
