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

WORKDIR /app/apps/api

EXPOSE ${PORT:-3000}

CMD ["npx", "tsx", "src/index.ts"]
