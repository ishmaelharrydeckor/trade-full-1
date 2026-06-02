# Contributing to trade-full-1

Thanks for your interest in contributing. A few important things before you start.

## License + IP assignment

By submitting a pull request, you agree:

1. Your contribution is licensed under **AGPL-3.0** along with the rest of the codebase
2. You assign all copyright in your contribution to the maintainer
3. You confirm you have the legal right to make this assignment

This is the same model used by most commercial open-source projects (Mongo, Sentry, Plausible, etc.).

## How to contribute

1. **Open an issue first.** Discuss your proposed change before writing code. PRs that show up without prior issue discussion are usually closed.
2. **Fork the repo** and create a feature branch (`feat/your-change` or `fix/your-bug`)
3. **Open a pull request** against `main` with:
   - Clear description of what changed and why
   - Screenshots if you changed any UI
   - Link to the related issue (`Closes #123`)
4. Wait for review. I review most PRs within a week.

## Code quality

- **TypeScript strict** — no `any` without explicit justification in a comment
- **Build must pass** — run `npm run build` locally before pushing
- **Follow existing style** — Prettier is configured, just match what's already there
- **Comments only when needed** — well-named code beats commented code

## What I welcome

- Bug fixes — always
- Documentation improvements
- New broker CSV parsers (especially African brokers — Exness, FBS, HotForex, etc.)
- Translations to local languages (Twi, Ewe, Hausa, Yoruba, French, etc.)
- Accessibility improvements
- Performance optimizations with measurements

## What I usually decline

- New top-level features without prior issue discussion
- Style/formatting refactors that don't add user value
- Drive-by PRs from accounts with no engagement history
- AI-generated boilerplate PRs

## Getting in touch

Use issues for everything technical. For partnership / business inquiries, email me (address in the README).

Thanks for helping make this better.
