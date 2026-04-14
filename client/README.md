# Frontend App

## Overview

`client/` is the React + Vite frontend for the AI Model Provenance System.

Current pages:

- `Overview`
- `Training`
- `Registry`
- `Audit`
- `System`
- `NFT`

## Development

Install dependencies:

```bash
cd client
npm install
```

Start the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

## Environment Variables

The frontend primarily reads:

- `VITE_API_URL`
- `VITE_WRITE_API_KEY`

Behavior:

- if `VITE_API_URL` is missing, the frontend uses relative `/api/...` requests
- if `VITE_WRITE_API_KEY` is missing, the UI stays read-only

## API Usage

The frontend calls:

- `GET /api/health`
- `GET /api/v2/status`
- `GET /api/v2/models`
- `GET /api/v2/models/:id`
- `GET /api/v2/audit/recent`
- `GET /api/v2/audit/verify/:id`
- `POST /api/register`

`POST /api/register` includes:

- `x-api-key`
- `x-auth-timestamp`
- `x-auth-nonce`

## UX Rules

- first-load critical data depends on `health`, `status`, and `models`
- audit feed failures must not collapse the entire app into a backend-unavailable state
- registrations may appear as `PENDING_REGISTRATION` before final chain confirmation
- read-only mode must be explicit when write access is not configured

## File Map

- `src/App.jsx`: page state and data orchestration
- `src/lib/api.js`: API client helpers
- `src/pages/`: page components
- `src/components/`: layout and UI components
- `src/assets/`: static visual assets

## Notes

- This is no longer the default Vite template README.
- If API behavior changes, update `src/lib/api.js` first and then sync the relevant docs in the repo root and `docs/`.
