FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

# Install dependencies
RUN npm install

# Copy source
COPY packages/shared packages/shared
COPY apps/api apps/api
COPY tsconfig.base.json ./

# Build shared + api
RUN npm run build -w packages/shared && npm run build -w apps/api

WORKDIR /app/apps/api

EXPOSE ${PORT:-3000}

CMD ["node", "dist/index.js"]
