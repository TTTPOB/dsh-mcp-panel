# dsh-mcp-panel

这是基于 0.6.24 的 [PerryLink/dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel) 个人 fork，由 TTTPOB 维护。在设置 → 插件 → MCP 中管理官方 DeepSeek Harness MCP 客户端。

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

## 使用

重连通过 Cordis Fiber.restart() 仅重启选中的已启用 MCP 插件，关闭旧连接并重置重试预算，不修改配置。操作确认表示插件已重启，不代表服务器已经连接成功。已禁用的条目需要另外启用。

刷新只重新读取状态快照。探测使用活动插件已求值的配置（包含动态认证 header 和环境变量）另外执行 HTTP 或 stdio 握手；两者都不是重连。刷新失败保留上次成功快照；无法观测的连接字段仍显示未知。

```text
/mcp
/mcp <server> tools
/mcp <server> health
/mcp <server> call <tool> [json]
```

## Configuration

| 键 | 默认值 | 含义 |
|---|---|---|
| `probeEnabled` | `true` | 注册 `mcp_probe` 后台任务工具（结果仅面板可见） |
| `probeTimeoutMs` | `10000` | 单次探测超时（ms） |
| `maxProbes` | `10` | 面板展示的探测记录数 |
| `refreshIntervalMs` | `0` | 建议的面板刷新间隔（ms）；`0` = 按需 |
| `outputLanguage` | `en` | `/mcp` 输出语言：`en \| zh \| es \| pt \| hi` |
| `passiveProbeEnabled` | `false` | 周期性探测 streamable-http 服务器 |
| `passiveProbeIntervalMs` | `60000` | 被动探测间隔（ms） |
| `trialEnabled` | `true` | 工具试用台（设置页 + `/mcp call`） |
| `trialTimeoutMs` | `120000` | 每次试用调用的面板侧截止时间（ms） |
| `trialMaxResultChars` | `60000` | 试用结果载荷上限（字符） |
| `writeEnabled` | `true` | 总开关：`false` 拒绝一切 profile 写入（仍可复制片段） |
| `writeVerifyEnabled` | `true` | 每次写入在报成功前对照 loader 重放后的状态复验 |
| `writeVerifyTimeoutMs` | `3000` | 写入复验的轮询预算（毫秒） |
| `backupCount` | `5` | 每次写入保留的 `cordis.patch.yml` 备份数 |
| `catalogEntries` | `[]` | 推荐服务器目录的用户覆盖：追加条目，同 `id` 的条目替换内置条目 |

## 开发

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

## 发布

[ADR](docs/adr/) · [GitHub Releases](https://github.com/TTTPOB/dsh-mcp-panel/releases) · [Apache-2.0](LICENSE)

```sh
gh release download v0.6.24-fork1 --repo TTTPOB/dsh-mcp-panel --pattern "*.tgz"
dsh plugin --profile web add ./dsh-mcp-panel-0.6.24-fork1.tgz
```
