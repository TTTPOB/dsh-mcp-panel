# Contributing to dsh-mcp-panel

This personal fork is maintained on `main` at `TTTPOB/dsh-mcp-panel`. Develop on a separate branch. Design decisions live in [docs/adr/](docs/adr/).

## Checks

```sh
pnpm install --frozen-lockfile
pnpm run typecheck:ci
pnpm test
pnpm run lint
pnpm run check:readmes
pnpm run build
pnpm run verify:self-contained
pnpm run verify:artifacts
pnpm pack
```

Type checks use the declared npm development dependencies without an adjacent Harness checkout. Source tests use isolated fixtures and dummy credentials. Packaged behavior must also be exercised through the target Host resolver; importing the source is not packaged verification.

## Release

1. Update the package version and probe clientInfo together using `<base>-forkN`, and add its dated CHANGELOG section.
2. Run the relevant source checks, build a local tarball, and validate it in an isolated target composition. Local tarballs are test inputs, not installation sources.
3. Merge to `main`, push, and wait for branch CI to pass.
4. Tag the verified commit as `v<version>` and push only that tag. The Release workflow requires a commit on `main`, reruns its checks, and creates immutable GitHub Release tarballs. It does not publish to npm. Never replace existing tags or assets.
5. Select the actual published asset URL in the configuration repository, run its two-machine checks and update previews, and keep installation and Host activation separately authorized.

## Style

Document non-obvious public behavior, use conventional commit messages, and test realistic regressions with the smallest useful fixture. Never put real credentials or machine configuration in public source, tests, screenshots, or reports.
