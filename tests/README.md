# Panel behavior tests

Run `pnpm test` for the normal pinned DSH development dependencies. The shared harness mounts the real Session, ToolRuntime, SystemPrompt, and CommandRuntime services.

After resolving the matching fork `@deepseek-ai/dsh-tool-executor-ptc` through temporary pnpm overrides, run `DSH_FORK_PTC_NATIVE=1 pnpm test`. The PTC trial cases first reject a tool outside the native-exception list, then execute the same MCP or resource trial directly in the Agent's configured PTC scope. They check argument delivery, resource-server injection, result projection, and absence of model-response logging; the fixture runtime rejects any attempted code execution.

Local fork paths belong only in temporary validation overrides. Restore the workspace configuration and package-manager-generated lockfile after validation; do not commit absolute paths.
