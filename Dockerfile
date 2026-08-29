# ============================================================
# Deb8 - single image that builds the React client and runs the
# Express API + Socket.io + static frontend from ONE server.
# Works on Koyeb, Fly.io, Railway, GCP Cloud Run, Render, etc.
# ============================================================

# ---------- Stage 1: build the React client ----------
FROM node:20-slim AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm install
COPY client/ ./
# Produces /app/client/dist (served by Express in production)
RUN npm run build

# ---------- Stage 2: production server ----------
FROM node:20-slim
ENV NODE_ENV=production
WORKDIR /app

# Install server runtime deps
COPY server/package.json server/package-lock.json ./server/
WORKDIR /app/server
RUN npm install --omit=dev

# Server source
COPY server/src ./src

# The built frontend, at the path app.js resolves (<file> -> ../../client/dist)
COPY --from=client-build /app/client/dist /app/client/dist

WORKDIR /app/server
EXPOSE 4000
# PORT is injected by the platform; the server reads process.env.PORT (default 4000)
CMD ["node", "src/server.js"]
