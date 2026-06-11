# Pi Vendor Provenance

## Upstream

- Repository: `https://github.com/earendil-works/pi`
- Release tag: `v0.79.1`
- Commit SHA: `28df940f0d07b65284849a483be7b06e2ca046ee`
- Copied source package targets:
  - `packages/pi-vendor/src/pi-agent-core/`
  - `packages/pi-vendor/src/pi-ai/`

## Copied Scope

The vendored package is reserved for upstream Pi source and dependency declarations required by that source. MyBoTeam task lifecycle, daemon routing, provider credential callbacks, tool bridges, and diagnostic wrappers belong in `@myboteam/pi-agent-core`.

## Local Adaptations

- Workspace package metadata is adapted for the MyBoTeam pnpm monorepo.
- TypeScript build output targets `dist/`.
- Upstream `@earendil-works/pi-ai` imports are rewritten to local relative imports between the copied `pi-agent-core` and `pi-ai` source trees.
- Runtime import specifiers are normalized from `.ts` to `.js` for this repo's ESM TypeScript settings.
- Direct dependency declarations are copied into `packages/pi-vendor/package.json` for the vendored source, including Smithy/AWS, provider SDK, proxy, parser, schema, and YAML packages.
- `amazon-bedrock.ts` contains a narrow Smithy middleware-stack typing shim for the current dependency versions.
- `harness/session/uuid.ts` uses `Uint8Array<ArrayBuffer>` annotations required by the current TypeScript/lib.dom types.
- MyBoTeam wrapper logic is intentionally excluded from this package.

## Copied-Scope Checks

- `packages/pi-vendor/src/pi-agent-core/` must contain only copied/adapted upstream Pi agent source.
- `packages/pi-vendor/src/pi-ai/` must contain only copied/adapted upstream Pi AI provider source.
- `packages/pi-vendor/src/index.ts` is the only MyBoTeam-authored source entrypoint in `src/`; it exposes provenance constants and namespace exports.
- Wrapper/adapters must remain in `packages/pi-agent-core/`.
- Validate with `pnpm -F @myboteam/pi-vendor exec tsc --noEmit` and `pnpm -F @myboteam/pi-vendor test`.

## Update Procedure

1. Confirm the new upstream release tag and commit SHA.
2. Replace only the copied upstream source directories under `packages/pi-vendor/src/`.
3. Update dependency declarations required by copied upstream imports.
4. Record any local adaptations in this file.
5. Reapply only the local adaptations listed above when still required by the new upstream snapshot.
6. Run `pnpm -F @myboteam/pi-vendor exec tsc --noEmit`, `pnpm -F @myboteam/pi-vendor test`, and package boundary checks.
7. Run downstream `@myboteam/pi-agent-core` tests before accepting the refresh.

## License And Notice Review

Status: deferred to release review before release readiness. MAO-66 implementation must not mark release readiness complete until license and notice handling is reviewed and recorded in `specs/001-pi-vendor-harness/validation-evidence.md`.
