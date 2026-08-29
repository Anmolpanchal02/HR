# AI HR Copilot — Backend

Node.js + TypeScript + Fastify REST API for the AI Engineering / HR Copilot platform.

## Prerequisites

- Node.js 20+
- MongoDB (local or Docker)

## Setup

```bash
cp .env.example .env
npm install
```

## Development

```bash
npm run dev
```

API runs at `http://localhost:5001` (local dev).

## Health Check

```bash
curl http://localhost:5001/api/v1/health
```

## Scripts

| Script  | Description              |
| ------- | ------------------------ |
| `dev`   | Start with hot reload    |
| `build` | Compile TypeScript       |
| `start` | Run production build     |
| `lint`  | Run ESLint               |
| `format`| Format with Prettier     |
