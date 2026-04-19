# Frontend Notes

The frontend is a React + Vite presentation surface for the final repository-aligned AI provenance backend.

## Final Scope

The browser now focuses on:

- health and runtime status
- registry browsing
- audit verification
- lifecycle lookup and download after login
- communicating the SDK-first training workflow

The browser no longer performs public model writes.

## Environment

Primary frontend environment variable:

- `VITE_API_URL`

Behavior:

- if `VITE_API_URL` is missing, the frontend uses relative `/api/...` requests
- no `VITE_WRITE_API_KEY` is required

## Auth Behavior

The frontend uses backend JWT auth for:

- `GET /api/auth/me`
- `POST /api/v2/lifecycle/query`
- `POST /api/v2/lifecycle/download`

The frontend stores the JWT in session storage for the active browser session.

## Pages

- Overview
  - backend status
  - chain readiness
  - registry and audit summary

- Training
  - SDK-first write explanation
  - lifecycle query and download

- Registry
  - backend-managed model index
  - owner, chain, and `isActive` state

- Audit
  - `chainVerified` results and recent events

- System
  - `authMode`, `relayMode`, chain state, and deployment metadata

## Development

Start the frontend:

```bash
cd client
npm run dev
```

Validate:

```bash
cd client
npm run lint
npm run build
```
