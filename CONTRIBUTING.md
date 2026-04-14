# Contributing

## Local Setup

```bash
git clone https://github.com/zhouziyu12/final-year-project.git
cd final-year-project
npm install
cd client && npm install
cd ..
```

Copy `.env.example` to `.env` and provide testnet private keys, backend write key, and Pinata credentials.

## Branching

Use short, readable branch names:

```bash
git checkout -b feat/zk-bridge-hardening
git checkout -b fix/backend-write-auth
git checkout -b docs/rewrite-guides
```

## Commit Style

Use conventional commits:

```text
feat: add pending registration status
fix: bind zk bridge payload to nonce and chain
docs: rewrite project markdown set
test: harden sdk backend regression suite
refactor: simplify registry transfer checks
```

## Required Checks

Before submitting work, confirm:

```bash
npx hardhat compile --show-stack-traces
cd client && npm run lint && npm run build && cd ..
node tests/test_zk_proof.js
python tests/test_sdk_backend.py
node tests/test_smart_contracts.js
```

For the full Windows regression flow:

```powershell
powershell -ExecutionPolicy Bypass -File tests/run_all_tests.ps1
```

## Contribution Rules

- Keep documentation aligned with the current implementation.
- Do not introduce `.backup`, `.old`, handoff, or summary-only temporary files.
- Avoid mojibake, mixed encodings, or mixed-language comments without a reason.
- Update `README.md` and the relevant topical doc when behavior changes.
- Do not rewrite `address_v2_multi.json` or deployment notes unless the deployment metadata actually changed.

## Pull Request Checklist

- [ ] Scope is limited to the intended change
- [ ] Contracts compile successfully
- [ ] Frontend lint and build pass
- [ ] Relevant tests pass, or failures are explained
- [ ] Documentation is updated

## Bug Reports

Include:

- the exact failing command
- the complete error output
- affected file paths
- the network or environment used

## Questions

Prefer issues or PR discussions for implementation questions.
