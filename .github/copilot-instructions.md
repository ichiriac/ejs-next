# Copilot Instructions

## Big Picture
- `lib/lexer.js → transpiler.js → output.js → ejs.js` is the render pipeline; updates in one stage usually require corresponding fixtures/tests in others.
- Runtime must stay browser-friendly: avoid Node-only globals unless guarded (see `lib/browser.js` + `web.js` bundler script).
- Core dependencies are `meriyah` (parsing) and `astring` (codegen); keep AST manipulations minimal and deterministic for snapshot tests.

## Engine Patterns
- `ejs.prototype.render` and `renderFile` always return Promises; keep helpers async-safe and avoid blocking I/O beyond `fs.readFile` in `renderFile`.
- Path resolution flows through `resolveInclude → selectFirstPathMatch`; respect `options.root` (array support) when adding file access.
- Layouts/blocks mutate `_session` per engine instance; reuse the existing `output` buffer interface (`write`, `safe_write`, `buffer`) instead of ad-hoc strings.
- Custom helpers register via `ejs.registerFunction`; compiler injects bindings when identifiers are looked up—avoid naming clashes with env globals in `transpiler.js`.

## Project Conventions
- Stick to CommonJS + classic `var/const` patterns; new files should mirror surrounding style (no top-level `await`, no ESM syntax).
- Do not add inline comments inside templates in tests; rely on snapshots under `test/__snapshots__` to flag regressions.
- Option structs default to `{ cache:false, strict:false, profile:false, delimiter:"%", root:"/" }`; new features must expose opts through this object.
- Error handling: in non-strict mode renderers swallow errors and emit HTML comments—reuse `renderError` pattern in `renderFile`.

## Workflows
- Install deps once via `npm install` (already committed `package-lock.json`).
- Run unit tests: `npm test`; add `npm run cover` before publishing to refresh `/coverage` artifacts.
- Browser bundles: `node web.js` writes `dist/ejs*.js`; script assumes files already transpile—keep it in sync when touching `lib/`.
- Benchmarks in `test/bench.js` compare ejs vs ejs-next; require `microtime` native build, so gate new benchmark cases behind cheap feature checks.

## Testing & Fixtures
- Jest snapshots cover lexer/transpiler/ejs behavior; update with `npm test -- -u` only when intentional parser output changes.
- Template fixtures live in `test/views/*.ejs`; reuse them for integration tests to keep coverage meaningful.
- For async scenarios, prefer promise-returning helpers (see `include/layout/block` usage) so output buffering remains consistent.

## Gotchas
- `output.safe_write` sanitizes strings unless the chunk is a Promise; when introducing new async flows, mark indices in `sanitize` like existing code does.
- `renderFile` re-resolves `filename` before reading—when adding cache layers or watchers, operate on resolved paths to preserve include stacks.
- Keep `lib/ejs.js` constructor options serializable; `web.js` embeds them into browser bundles without transpilation.