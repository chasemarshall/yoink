FROM node:20-slim AS base

# Install Python, ffmpeg, and spotdl
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/spotdl-venv && \
    /opt/spotdl-venv/bin/pip install spotdl

ENV PATH="/opt/spotdl-venv/bin:$PATH"

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
