# ADR 0001: Recover MCP connections through their plugin lifecycle

- Status: Accepted
- Date: 2026-10-18

## Context

The official MCP client stops retrying after its configured reconnect budget is exhausted. Restoring an external server does not restart that stopped supervisor. The management panel needs an explicit recovery action for one server without a Host restart or a persistent configuration change.

The original panel builds probes from serialized Loader options. Dynamic configuration such as `Authorization: !!js ...` is still an expression node there; retaining only string headers silently removes authentication. Its details grid also treats whole label/value groups as columns, while its root spacing selector does not match the root element. A refresh error replaces the last successful snapshot and stops periodic refresh.

## Decision

1. **Restart the owned plugin instance.** The panel exposes `mcpPanel/reconnect(entryId)` and calls the selected MCP entry’s public `Fiber.restart()`. Cordis tears down the old instance before reapplying it. The official MCP client remains responsible for closing its transport, cancelling its backoff, registering tools, and starting with a fresh retry budget. The operation neither writes a patch nor toggles the entry’s enabled state.
2. **Use entry identity.** Runtime control targets the Loader entry id rather than a display name. Disabled, missing, or unsupported entries fail explicitly. The panel disables the selected entry’s reconnect button while its request is pending.
3. **Keep acknowledgement separate from health.** A successful restart response reports plugin lifecycle completion. It does not manufacture a connected status: startup can be asynchronous, and unobserved MCP state remains unknown. Refresh reloads snapshots; a probe performs a separate handshake. Neither substitutes for reconnect.
4. **Probe effective configuration.** Probe input comes from the active target fiber’s resolved configuration, evaluated by Loader in that plugin’s own context. It retains dynamic header maps and stdio environment maps without copying evaluation logic or reading another credential store. Missing effective configuration is an explicit failure rather than an unauthenticated fallback. Header and environment values stay on the Host.
5. **Keep recovery visible and usable.** The panel separates refresh, reconnect, probe, and configuration editing. Reconnect has a pending state and an explicit result. Details use one bounded label/value grid per row; controls share spacing and interaction states, including narrow layouts. A refresh failure preserves the last successful snapshot and permits later recovery.
6. **Deliver a standalone personal fork.** TTTPOB owns this fork’s release branch and immutable GitHub tarballs. The implementation is based on the installed 0.6.24 rather than an unrelated upstream upgrade. The configuration repository selects a verified Release asset only after source and packaged checks; local tarballs are restricted to isolated smoke tests.

## Rejected alternatives

- **Calling probe or refreshing the snapshot from a reconnect-labelled button.** Neither operation restarts the client that exhausted its retry budget.
- **Disabling and enabling configuration.** This persists an unrelated state change and can trigger Loader writes. Calling `Fiber.dispose()` directly also has Loader-specific self-disposal semantics. `Fiber.restart()` expresses the intended lifetime operation.
- **Adding a parallel MCP supervisor or a core control service.** The public Cordis lifecycle already restarts the correct owner and its effects. Another owner would duplicate connection, timer, and tool cleanup logic.
- **Evaluating serialized expressions inside the panel.** Evaluation depends on the target plugin context and declared injections; the panel cannot reproduce that safely or accurately.
- **A new UI framework or a global style override.** Scoped panel styles can align with the Host’s tokens without changing unrelated Settings surfaces or bundling a second control system.

## Consequences

- Reconnect briefly interrupts the selected server’s tools and resources; it is an explicit user action, not seamless failover. All sessions using that MCP instance share the interruption.
- A stopped external server can still fail after a successful restart acknowledgement. The user can retry after restoring it; ordinary client retry policy remains unchanged.
- Dynamic values are evaluated at plugin activation. Updating an external credential source may require reconnect before a probe can use the new value.
- A disabled or inactive entry has no active effective configuration to probe. Enabling configuration and restarting an existing instance remain distinct actions.
- No OAuth store, token-refresh service, transport implementation, or guessed connection-health signal is added.

## Required verification

- Real Loader and Include expressions retain individual dynamic headers, whole header maps, and stdio environment maps; a loopback MCP server rejects requests without the expected dummy authorization.
- The official client exhausts retries while the fixture server is unavailable, then recovers tools and a real tool call after the server returns and the panel requests reconnect. Restart during backoff cancels the old pending retry and does not duplicate tools.
- The configuration bytes and Loader write count are unchanged by reconnect. Disabled rows, missing rows, lifecycle failures, and unsupported APIs produce actionable errors.
- Component tests exercise entry-id targeting, pending and failed reconnect, preserved snapshots after refresh failure, and subsequent refresh recovery. Browser inspection checks desktop and narrow layouts with long values.
- Built artifacts and the formal Host resolver are checked independently of source imports. Both workstation and server configurations pass render/check and update preview; any isolated smoke uses its own DSH_HOME and port, and leaves the daily Host untouched.

## References

- [User guide](../../README.md)
- [Panel service](../../src/service.ts)
- [Remote descriptors](../../src/wire.ts)
- [Panel component](../../src/client/McpPanelTab.tsx)
