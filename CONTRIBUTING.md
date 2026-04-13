# Contributing

## Setup

```bash
git clone https://github.com/zhouziyu12/final-year-project.git
cd final-year-project
npm install
cd client && npm install
cd ..
```

## Branching

Use a short feature or fix branch name:

```bash
git checkout -b feature/your-change
```

## Commit Style

Use conventional commit messages:

```text
feat: add model lifecycle endpoint
fix: correct audit chain verification
docs: refresh deployment guide
test: update backend integration flow
refactor: simplify nft mint validation
```

## Before Opening a Pull Request

Make sure these pass:

```bash
npx hardhat compile
cd client && npm run build && cd ..
python -m py_compile sdk/python/provenance_sdk.py sdk/python/model_secret_manager.py tests/test_sdk_backend.py
powershell -ExecutionPolicy Bypass -File tests/run_all_tests.ps1
```

## Code Expectations

- Keep Solidity comments and documentation in English
- Keep Markdown documentation in English
- Do not introduce new mojibake or mixed-encoding files
- Prefer updating existing scripts and docs instead of adding duplicate files
- Do not remove deployed-address references unless they are actually obsolete

## Pull Request Checklist

- [ ] Scope is limited to the intended change
- [ ] Contracts compile successfully
- [ ] Frontend builds successfully
- [ ] Tests pass or failures are explained
- [ ] Documentation is updated when behavior changes

## Reporting Issues

Include:

- exact command that failed
- full error output
- affected file paths
- network or environment used

## Questions

Open an issue or start a discussion in the repository.
