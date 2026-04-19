# ZK Guide

This document describes the zero-knowledge proving path used by the final repository-aligned workflow.

## 1. Core Idea

The live application path binds a proof to the exact canonical metadata string that the backend will anchor on-chain.

Proof inputs are conceptually:

- `secret`
- `modelId`
- `statementHash`

The circuit still names the third witness input `messageHash`, but that is now only a circuit compatibility label.

## 2. Runtime Path

The ZK runtime path is:

1. the SDK logs in and obtains a JWT
2. the SDK resolves or registers the model under `chain + owner + modelName`
3. the SDK uploads the artifact to IPFS
4. the SDK builds `canonicalMetadata`
5. the SDK computes `statementHash = keccak256(canonicalMetadata) % field`
6. the prover receives that value in the witness slot named `messageHash`
7. the prover writes one isolated `.proof_runs/<run-id>/` directory
8. the SDK submits `canonicalMetadata + zkProof`
9. the backend recomputes `statementHash`
10. the backend verifies the proof and writes through `ZKProvenanceTracker`

## 3. Proof Artifact Layout

Each SDK submission now writes proof artifacts into its own run directory, for example:

```text
.proof_runs/20260415T190632-4f3a9d2e/
  last_proof_input.json
  proof.json
  public.json
  proof_calldata_debug.txt
```

This replaces the older shared-root layout and prevents concurrent proof jobs from overwriting each other.

## 4. Circuit Semantics

The circuit still expects witness fields named:

- `secret`
- `modelId`
- `messageHash`

Public signals remain:

- `nullifier`
- `modelId`
- `messageHash`

Application translation:

- SDK/backend term: `statementHash`
- circuit/public-signal label: `messageHash`

The two refer to the same numeric value in the final main path.

## 5. Canonical Metadata Contract

The proof is bound to the canonical metadata string, not to arbitrary UI input.

Required fields inside `canonicalMetadata`:

- `action`
- `artifactCid`
- `chain`
- `commit`
- `modelHash`
- `modelName`
- `sender`
- `submittedAt`
- `trainingMetadata`
- `versionTag`

Important constraint:

- proof fields must not appear inside `canonicalMetadata`
- proof fields must not appear inside `trainingMetadata`

This means the old pattern of embedding `zk_verified`, `zk_public_signals`, or calldata blobs inside `trainingMetadata` is no longer the documented main path.

## 6. Example Witness Input

Example application-side proof input before circuit translation:

```json
{
  "secret": "123456",
  "modelId": "999999999",
  "statementHash": "424242",
  "messageHash": "424242"
}
```

In the application path:

- `statementHash` is the application term
- `messageHash` is the circuit-compatibility alias carrying the same numeric value

That value is derived from:

```text
statementHash = keccak256(canonicalMetadata) % snark_field
```

## 7. Backend Verification Rules

Before writing provenance on-chain, the backend checks:

1. the authenticated user owns the target model
2. `canonicalMetadata` parses as a JSON object
3. `canonicalMetadata.modelName` matches the top-level `modelName`
4. `canonicalMetadata.chain` matches the top-level `chain`
5. `zkProof.publicSignals[1]` matches `modelId`
6. `zkProof.publicSignals[2]` matches the recomputed `statementHash`
7. the on-chain verifier accepts the proof

Only then does the backend call:

```text
ZKProvenanceTracker.addVerifiedRecord(...)
```

## 8. What the Frontend Does Not Do

The frontend does not:

- compute proofs
- submit model writes
- hold a public write API key

The frontend can only:

- explain the proof flow
- show chain and registry status
- query lifecycle state after login
- download previously anchored versions after login

## 9. Windows Support

The repository still supports native Windows proving and regression runs.

Re-verified on 2026-04-15 with:

```bash
node tests/test_zk_proof.js
node test_zk_standalone.js
```

## 10. Narrative Boundary

True today:

- local proof generation is implemented
- local proof verification is implemented
- the proof is bound to canonical metadata
- the backend re-checks `statementHash` before anchoring provenance

Not the main path today:

- bridge-first provenance writes
- storing proof blobs inside business metadata
- browser-based proof submission

The ZK story that matches the codebase is:

```text
canonicalMetadata
-> statementHash
-> witness field named messageHash
-> verifier-gated backend relay
-> on-chain provenance record
```
