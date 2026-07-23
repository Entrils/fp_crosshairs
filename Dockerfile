FROM node:24.17.0-alpine3.24 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:24.17.0-alpine3.24 AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/package.json /app/package-lock.json ./
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/backend ./backend
COPY --from=build --chown=app:app /app/data ./data
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/server.js ./
USER app
EXPOSE 4173
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4173/healthz >/dev/null || exit 1
CMD ["node", "server.js"]
