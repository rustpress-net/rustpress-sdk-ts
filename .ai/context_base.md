# rustpress-sdk-ts — AI Context

> **Purpose**: Orient an AI agent to this repo without reading the whole tree. Pair with the RustPress organisation context in `rustpress-core-base/.ai/context/CONTEXT_BASE.md`.

## Project

`rustpress-sdk-ts` is the **official TypeScript SDK for RustPress**, published as the scoped npm package `@rustpress/sdk`. It is the type surface that TypeScript/JavaScript plugin, theme, and app authors program against when extending RustPress (the CMS in `rustpress-core-base`). It defines interfaces — `RustPressContext`, `AuthService`, `Database`, `Cache`, `HttpClient`, `Logger`, etc. — and the base classes plugin authors extend.

This SDK is the **most sophisticated of the four** (Rust, TS, Python, JS) in terms of build pipeline: it ships dual CJS+ESM with `.d.ts` types and four subpath exports. API parity with the other three SDKs is a hard requirement.

## Tech stack

- **Language**: TypeScript 5.3+, target Node ≥18
- **Package**: `@rustpress/sdk` v1.0.0, MIT
- **Build**: `tsup` → dual CJS (`dist/index.js`) + ESM (`dist/index.mjs`) + `.d.ts`
- **Test**: `vitest`
- **Lint**: `eslint` + `@typescript-eslint`
- **Peer**: `typescript >= 4.7.0`
- **Binary**: ships a `rustpress` CLI (`dist/cli.js`) for scaffolding

## Directory layout

```
rustpress-sdk-ts/
├── package.json        # @rustpress/sdk, dual CJS/ESM exports, subpaths
├── tsconfig.json
├── README.md
├── LICENSE             # MIT
└── src/
    ├── index.ts        # 863 lines — the public API
    ├── cli.ts          # rustpress CLI scaffolder
    └── __tests__/      # vitest suite (uncommitted; being added)
```

`dist/` is the build output and is gitignored. The package's `files` field publishes only `dist`, `bin`, `README.md`, `LICENSE`.

## Public API / what this repo exposes

All exports come from `src/index.ts`. `package.json` declares four subpath entries that re-export filtered surfaces:

```
@rustpress/sdk            → full API (src/index.ts)
@rustpress/sdk/hooks      → hook utilities
@rustpress/sdk/plugins    → plugin base classes
@rustpress/sdk/database   → DB types
@rustpress/sdk/api        → HTTP API types
```

Each subpath exports `import` (ESM .mjs), `require` (CJS .js), and `types` (.d.ts).

The interface set (from the audit, line numbers in `src/index.ts`):
`TriggerArgs` (14), `RustPressContext` (29), `User` (62), `Session` (75), `AuthService` (85), `Database` (101), `Collection` (114), `QueryBuilder` (129), `Cache` (190), `HttpClient` (211), `NotificationService` (245), `QueueService` (276), `TemplateService` (313), `StorageService` (331), `Logger` (369), `ConfigService` (382), `EventEmitter` (393). Plus the `BasePlugin`, `BaseTheme`, `BaseApp` classes and utility fns at lines 801–856.

## How to build / test

```bash
npm install
npm run build       # tsup → dist/ (CJS + ESM + .d.ts)
npm run dev         # tsup --watch
npm test            # vitest
npm run test:coverage
npm run lint
npm run typecheck   # tsc --noEmit
npm run prepublishOnly  # runs build before npm publish
```

CI: `rustpress-net/rustpress-core-devops/actions/ci-node@main`.

## Cross-repo dependencies

- **Depends on**: no other RustPress repo. Pure TS definitions; runs anywhere Node ≥18 runs.
- **Depended on by**: every TS/JS plugin, theme, or app built on RustPress. Also imported by `rustpress-core-admin-ui` *if* any shared types ever flow that direction (today they don't — admin-ui types are local).
- **Coordinated with**: `rustpress-sdk-rs`, `rustpress-sdk-py`, `rustpress-sdk-js` for API parity. Renaming a public symbol here means doing the same in all four in one coordinated bump.

## Conventions

- **License**: MIT (align to `MIT OR Apache-2.0` before v1.0 publish to match org standard)
- **Commits**: Conventional Commits
- **Public API stability**: v1.0 — every exported symbol is a commitment. Breaking changes bump to v2.
- **JSDoc**: every public interface/function carries a JSDoc block — this surface IS the documentation.

## Status

- Release readiness: **🟡 ALMOST READY** (see `AUDIT-sdks.md`)
- Best interface design of the four SDKs but **zero test coverage** (vitest is configured, but `src/` has no `.test.ts`/`.spec.ts` files on `main` yet).
- `package.json` stamped at v1.0.0, not yet published to npm.

## Known issues / TODOs

From `AUDIT-sdks.md` (TypeScript SDK section):

- **P0**: Zero test coverage. Need a vitest suite covering interfaces, utility fns, and the `Base*` classes (~50+ cases). The uncommitted `src/__tests__/` directory is the start of this.
- **P0**: Verify the four subpath builds actually produce files. After `npm run build`, `dist/hooks/index.{js,mjs,d.ts}` etc. must exist; if `tsup` is not configured to multi-entry, the subpath exports in `package.json` 404 on `import`.
- **P1**: Add strict-mode verification (`strict: true` in `tsconfig.json`).
- **P1**: Add advanced DB usage examples to README.
- **P1**: Repo URL in `package.json` still references `github.com/rustpress/rustpress-sdk-ts` (should be `rustpress-net/`).
- **P1**: Align license to `MIT OR Apache-2.0`.

## When working in this repo

- Every public symbol needs a JSDoc block. The SDK's docs are auto-derived from these.
- Keep parity with the three sibling SDKs. Public-surface changes here trigger coordinated PRs in `rustpress-sdk-rs`, `rustpress-sdk-py`, `rustpress-sdk-js`.
- Don't add runtime dependencies unless absolutely required — the SDK should be near-zero install weight. `tsup` is dev-only.
- If you add a new subpath export (e.g. `./queue`), update `package.json#exports`, `tsup` config, and `package.json#files` — and verify the build emits the corresponding files.
