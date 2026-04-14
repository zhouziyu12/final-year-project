import {
  Binary,
  Database,
  Fingerprint,
  HardDriveUpload,
  PlaySquare,
  ShieldCheck,
  Waypoints,
  Workflow
} from 'lucide-react';

export const PAGE_META = {
  overview: {
    eyebrow: 'System Overview',
    title: 'Model provenance dashboard for registration, verification, and traceable delivery',
    description: 'This interface now follows the actual backend contract: status, registry inventory, model detail, recent audit activity, and verification responses are all loaded from live endpoints.'
  },
  training: {
    eyebrow: 'Training and Submission',
    title: 'Map the local training pipeline to the backend and chain workflow',
    description: 'This page explains which artifacts are produced locally, which ones are anchored or relayed by the backend, and where the frontend can or cannot observe them directly.'
  },
  registry: {
    eyebrow: 'Model Registry',
    title: 'Inspect registered models and, when configured locally, submit new entries',
    description: 'The registry is driven by the backend model list and detail endpoints. Frontend writes stay disabled unless a local demo write key is explicitly configured.'
  },
  audit: {
    eyebrow: 'Audit Console',
    title: 'Verify provenance state and inspect recent audit activity',
    description: 'Run chain verification for a model ID, inspect the returned record count, and correlate the result with the latest audit events emitted by the backend.'
  },
  system: {
    eyebrow: 'System Status',
    title: 'Surface backend, chain, verifier-gated provenance, and write-mode readiness',
    description: 'This page exposes the runtime dependencies that make the project believable during a demo: service health, chain connectivity, verifier-gated provenance status, and write access mode.'
  },
  certificates: {
    eyebrow: 'Certificate View',
    title: 'Present verified models as certificate-style outputs',
    description: 'This remains a secondary showcase page built on top of live model records instead of replacing the core provenance workflow.'
  }
};

export const DEMO_LANES = [
  {
    step: '01',
    label: 'Training and Submission',
    copy: 'Explain how `train1.py` and `train2.py` produce artifacts that later move into the provenance pipeline.',
    cta: 'Open training flow',
    tab: 'training',
    icon: PlaySquare
  },
  {
    step: '02',
    label: 'Model Registry',
    copy: 'Inspect the live registry inventory returned by the backend and drill into one model at a time.',
    cta: 'Open registry',
    tab: 'registry',
    icon: Database
  },
  {
    step: '03',
    label: 'Audit Console',
    copy: 'Run the verifier against a real model ID and inspect the backend response as evidence.',
    cta: 'Open audit console',
    tab: 'audit',
    icon: ShieldCheck
  },
  {
    step: '04',
    label: 'System Status',
    copy: 'Show backend health, chain block height, relayer balance, and write mode before closing the demo.',
    cta: 'Open system status',
    tab: 'system',
    icon: Waypoints
  }
];

export const TRAINING_STEPS = [
  {
    title: 'Local training run',
    copy: '`train1.py` creates the first model artifact and `train2.py` extends an existing series with incremental training.',
    icon: PlaySquare
  },
  {
    title: 'Fingerprint and proof input',
    copy: 'The Python SDK computes the model hash, builds canonical metadata, and derives the verifier statement before any backend write is attempted.',
    icon: Fingerprint
  },
  {
    title: 'Proof generation',
    copy: 'The standalone prover produces `proof.json`, `public.json`, and Solidity-ready verifier arguments that can be reviewed later.',
    icon: Binary
  },
  {
    title: 'IPFS anchoring and backend relay',
    copy: 'The artifact is uploaded to IPFS first, then the backend relays canonical metadata and proof data through the verifier-gated write route.',
    icon: HardDriveUpload
  },
  {
    title: 'Chain-backed provenance record',
    copy: 'The registry and audit endpoints expose the resulting verifier-approved provenance record back to the frontend.',
    icon: Workflow
  }
];

export const TRAINING_ARTIFACTS = [
  {
    name: 'train1.py',
    producer: 'Local script',
    surfacedBy: 'Training workflow',
    note: 'Initial model training entry point.'
  },
  {
    name: 'train2.py',
    producer: 'Local script',
    surfacedBy: 'Training workflow',
    note: 'Incremental training entry point.'
  },
  {
    name: 'proof.json',
    producer: 'Standalone prover',
    surfacedBy: 'Local artifact only',
    note: 'Generated proof output, not directly indexed by the backend.'
  },
  {
    name: 'public.json',
    producer: 'Standalone prover',
    surfacedBy: 'Local artifact only',
    note: 'Public signals emitted during proof generation.'
  },
  {
    name: 'address_v2_multi.json',
    producer: 'Deployment output',
    surfacedBy: 'Backend configuration',
    note: 'Maps the deployed contracts per chain used by the server.'
  },
  {
    name: 'model_name_map.json',
    producer: 'Backend relayer',
    surfacedBy: 'Registry endpoints',
    note: 'Persists the mapping between model names and on-chain IDs.'
  }
];

export const RECORD_FIELD_LABELS = [
  'Record ID',
  'Model ID',
  'Event Type',
  'IPFS Metadata',
  'Timestamp',
  'Operator',
  'Previous Hash',
  'Entry Hash'
];

export const EVENT_TYPE_LABELS = {
  0: 'REGISTERED',
  1: 'ACTIVATED',
  2: 'UPDATED',
  3: 'DEPRECATED',
  4: 'REVOKED',
  5: 'VERSION_RELEASED',
  6: 'TRANSFERRED',
  7: 'STAKED',
  8: 'UNSTAKED',
  9: 'SLASHED',
  10: 'ZK_PROOF_VERIFIED'
};

export function getEventTypeLabel(value) {
  const key = Number(value);
  return EVENT_TYPE_LABELS[key] || `EVENT_${value}`;
}

export function normalizeTupleRecord(record) {
  if (!record) return [];
  if (Array.isArray(record)) return record;

  return Object.keys(record)
    .filter((key) => /^\d+$/.test(key))
    .sort((left, right) => Number(left) - Number(right))
    .map((key) => record[key]);
}
