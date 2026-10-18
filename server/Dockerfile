FROM node:24-alpine
WORKDIR /app
COPY src ./src
COPY server ./server
RUN mkdir -p /app/server/data && chown -R node:node /app/server/data
USER node
ENV HOST=0.0.0.0 PORT=8787
EXPOSE 8787
CMD ["node", "server/start.mjs"]
