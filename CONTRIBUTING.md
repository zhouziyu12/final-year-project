# Contributing to AI Model Provenance System

Thank you for your interest in contributing!

## Development Setup

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/final-year-project.git
cd final-year-project

# Add upstream remote
git remote add upstream https://github.com/zhouziyu12/final-year-project.git

# Create feature branch
git checkout -b feature/your-feature-name
```

## Code Style

- **Solidity**: Follow [Solidity style guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- **JavaScript**: Use ES6+ features, 2-space indentation
- **React**: Functional components with hooks

## Commit Messages

Use conventional commits:

```
feat: add new feature
fix: bug fix
docs: documentation changes
refactor: code refactoring
test: adding tests
chore: maintenance tasks
```

Example:
```
feat: add model versioning support
fix: resolve IPFS upload timeout
docs: update API documentation
```

## Pull Request Process

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated (if needed)
- [ ] Commits are atomic and well-described

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test test/ModelRegistry.test.js

# Run frontend tests
cd client && npm test
```

## Branch Protection

The `master` branch is protected:
- Requires PR review
- CI must pass
- No force pushes

## Questions?

Open an issue or reach out to the maintainers.
