# Frontend Information Architecture

## Purpose

This document records the current frontend information architecture and the boundaries for future changes so the UI does not drift back into a set of disconnected demo pages.

## Current Page Set

The frontend currently exports:

- `DashboardPage`
- `TrainingPage`
- `ModelsPage`
- `AuditPage`
- `SystemPage`
- `NFTPage`

These pages are orchestrated from `client/src/App.jsx`.

## Navigation Order

Keep the current order:

1. `overview`
2. `training`
3. `registry`
4. `audit`
5. `system`
6. `nft`

This matches the natural demo flow:

1. explain the project
2. show training and submission
3. show the registered model assets
4. show audit verification
5. show runtime system status
6. show NFT and extension capability

## Page Responsibilities

### Overview

Answers:

- what this system is
- whether the backend and chains are up
- what happened most recently

### Training

Answers:

- how a model moves from training artifact to provenance submission
- whether the ZK, IPFS, and SDK pipeline is understandable

### Registry

Answers:

- which models exist in the system
- which models are pending versus confirmed

Priority content:

- model table
- chain, status, owner, and staking state
- registration form
- explicit `PENDING_REGISTRATION` messaging

### Audit

Answers:

- whether a model passes provenance verification
- what recent audit events happened on-chain

### System

Answers:

- whether the backend is healthy
- whether `sepolia` and `tbnb` are connected
- whether the backend is read-only
- whether write authentication is enabled

### NFT

Answers:

- what the NFT and ownership extension looks like for this project

## Content Rules

Frontend copy must:

- prefer facts over marketing language
- focus on state, records, and evidence
- avoid generic AI-product buzzwords
- explain backend or chain failures precisely instead of collapsing everything into one backend-down message

Preferred vocabulary:

- registration
- provenance
- audit
- verification
- record
- chain status
- pending
- artifact

Avoid:

- revolutionary
- next-generation
- cutting-edge
- intelligent platform

## State Handling Rules

- `health`, `status`, and `models` are critical first-load data and must not be blocked by non-critical requests.
- The audit feed can degrade with `allSettled` and the app should still remain usable.
- Registrations should surface as `PENDING_REGISTRATION` before final chain confirmation.
- If write access is not enabled, the UI must explicitly present itself as read-only.

## Visual Direction

Keep the current direction:

- engineering-first information density
- presentation-friendly structure
- no purple AI template styling
- real workflow illustrations and status cards over generic decoration

## Future Work

Recommended next steps:

1. add a dedicated single-model detail page
2. extract the provenance timeline into a reusable component
3. add transaction-confirmation polling for registrations
4. connect the NFT page to real model-to-token relationships
