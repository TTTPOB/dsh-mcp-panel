# dsh-mcp-panel

This is the TTTPOB personal fork of [PerryLink/dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel), based on 0.6.24. It manages the official DeepSeek Harness MCP client from Settings → Plugins → MCP.

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

## Usage

Reconnect restarts only the selected enabled MCP plugin through Cordis Fiber.restart(). It closes the old connection and resets its retry budget without changing configuration. The acknowledgement means that the plugin was restarted, not that the server is already connected. Disabled rows must be enabled separately.

Refresh reloads the status snapshot. Probe performs a separate HTTP or stdio handshake using the active plugin’s resolved configuration, including dynamic headers and environment values. Neither operation reconnects the existing client. A failed refresh keeps the last snapshot visible; unknown connection fields remain unknown.

```text
/mcp
/mcp <server> tools
/mcp <server> health
/mcp <server> call <tool> [json]
```

## Configuration

| Key | Default | Meaning |
|---|---|---|
| `probeEnabled` | `true` | Register the `mcp_probe` background-job tool (panel-only results) |
| `probeTimeoutMs` | `10000` | Per-probe timeout in ms |
| `maxProbes` | `10` | Probe records shown in the panel |
| `refreshIntervalMs` | `0` | Suggested panel refresh in ms; `0` = on demand |
| `outputLanguage` | `en` | `/mcp` output language: `en \| zh \| es \| pt \| hi` |
| `passiveProbeEnabled` | `false` | Periodically probe streamable-http servers |
| `passiveProbeIntervalMs` | `60000` | Passive probe interval in ms |
| `trialEnabled` | `true` | Tool trial console (settings tab + `/mcp call`) |
| `trialTimeoutMs` | `120000` | Panel-side deadline per trial call in ms |
| `trialMaxResultChars` | `60000` | Cap on the trial result payload in chars |
| `writeEnabled` | `true` | Kill switch: `false` rejects every profile write (copy still works) |
| `writeVerifyEnabled` | `true` | Re-verify each write against the loader's re-applied state before reporting success |
| `writeVerifyTimeoutMs` | `3000` | Polling budget for write verification in ms |
| `backupCount` | `5` | `cordis.patch.yml` backups retained per write |
| `catalogEntries` | `[]` | User overlay for the recommended server directory: entries append, an entry with the same `id` replaces the built-in one |

## Development

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

## Release

[ADR](docs/adr/) · [GitHub Releases](https://github.com/TTTPOB/dsh-mcp-panel/releases) · [Apache-2.0](LICENSE)

```sh
gh release download v0.6.24-fork1 --repo TTTPOB/dsh-mcp-panel --pattern "*.tgz"
dsh plugin --profile web add ./dsh-mcp-panel-0.6.24-fork1.tgz
```
