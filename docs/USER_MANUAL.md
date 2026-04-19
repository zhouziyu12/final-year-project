# User Manual

This manual describes how to use the final repository-aligned application flow after the SDK-first write path refactor.

## 1. What Each Surface Is For

### Python SDK

Use the SDK when you want to:

- register a model
- upload an artifact
- generate a proof
- submit provenance

### Frontend

Use the frontend when you want to:

- inspect system health
- browse indexed models
- verify audits
- query lifecycle versions after login
- download a specific version after login

The frontend is not the normal place to submit training writes.

## 2. Starting the App

Start the backend:

```bash
node server/server.js
```

Start the frontend:

```bash
cd client
npm run dev
```

## 3. Default Demo Login

On first backend boot, a demo account is seeded automatically.

- username: `researcher`
- password: `researcher-demo-pass`

This account is bound to:

- `0x1111111111111111111111111111111111111111`

## 3.1 Create Another User

Create a new local backend account with:

```bash
node scripts/create_user.cjs create --username alice --password strong-pass --wallet 0xYourWallet --role researcher
```

Bootstrap an API admin account with:

```bash
node scripts/create_user.cjs create --username admin --password change-me --wallet 0xYourWallet --role admin
```

List users:

```bash
npm run user:list
```

Delete a user:

```bash
npm run user:delete -- --username alice
```

Once an admin account exists, the backend also exposes protected admin APIs:

- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:username`
- `DELETE /api/admin/users/:username`

## 4. Frontend Pages

### Overview

Shows:

- backend health
- chain connectivity
- registry counts
- recent audit activity

### Training

Shows:

- the SDK-first write story
- lifecycle query form
- version download actions after login

### Registry

Shows:

- backend-managed model index
- model status and owner
- whether a record is `ACTIVE`

### Audit

Shows:

- `chainVerified`
- record count
- latest record payload

### System

Shows:

- `authMode`
- `relayMode`
- contract addresses
- chain health

## 5. Query Lifecycle and Download a Version

1. Open the Training page.
2. Sign in with a backend account.
3. Enter the lifecycle secret.
4. Load the version list.
5. Download the chosen version.

The secret now travels in the authenticated request body, not in the URL.

## 6. Submit Through the SDK

A typical SDK flow is:

1. instantiate the SDK
2. log in with username/password
3. call the submission helper for a model artifact

The SDK handles:

- auth
- owner-scoped resolution
- artifact hashing
- IPFS upload
- proof generation
- provenance submission

## 7. Troubleshooting

### The frontend does not show a write button

That is expected. Browser write mode was removed.

### Login succeeds but model registration fails

Check:

- backend `PRIVATE_KEY`
- deployment addresses in `address_v2_multi.json`
- bound wallet ownership expectations

### Lifecycle query returns `401`

Cause:

- missing or expired JWT

Fix:

- sign in again from the frontend or obtain a fresh token through `/api/auth/login`

### Proof generation files appear in multiple folders

That is expected. Each SDK run now gets its own `.proof_runs/<run-id>/` directory.
