# dsh-mcp-panel

Este é o fork pessoal de TTTPOB de [PerryLink/dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel), baseado em 0.6.24. Gerencia o cliente MCP oficial em Configurações → Plugins → MCP.

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

Requer DSH 0.2.2-rc.1 e Node ≥24.9. As chamadas de teste usam o executor nativo ou PTC selecionado e suas permissões, sem registrar uma etapa do modelo; use um executor nativo no escopo do chamador. PTC mostra a recusa de chamadas diretas; o fork pessoal do DSH permite as ferramentas listadas em `ptcNativeTools`. Chamadas independentes admitem somente ferramentas incondicionais. A escrita preserva operações e comentários; remove o marcador vazio `[]` antes de acrescentar e mantém o original no backup.

## Uso

Reconectar reinicia somente o plugin MCP habilitado selecionado usando Cordis Fiber.restart(): fecha a conexão anterior e reinicia o orçamento de tentativas sem alterar a configuração. A confirmação indica que o plugin reiniciou, não que o servidor esteja conectado. As entradas desabilitadas precisam ser habilitadas separadamente.

Atualizar consulta o estado. A sondagem faz outro handshake HTTP ou stdio usando a configuração avaliada do plugin ativo, incluindo headers e variáveis de ambiente dinâmicos. Nenhuma dessas operações reconecta o cliente. Uma falha na atualização mantém o último estado visível; campos não observados continuam desconhecidos.

```text
/mcp
/mcp <server> tools
/mcp <server> health
/mcp <server> call <tool> [json]
```

## Configuration

| Chave | Padrão | Significado |
|---|---|---|
| `probeEnabled` | `true` | Registra a ferramenta `mcp_probe` (resultados somente do painel) |
| `probeTimeoutMs` | `10000` | Prazo por sonda em ms |
| `maxProbes` | `10` | Registros de sonda mostrados no painel |
| `refreshIntervalMs` | `0` | Atualização sugerida do painel em ms; `0` = sob demanda |
| `outputLanguage` | `en` | Idioma de saída do `/mcp`: `en \| zh \| es \| pt \| hi` |
| `passiveProbeEnabled` | `false` | Sondear periodicamente servidores streamable-http |
| `passiveProbeIntervalMs` | `60000` | Intervalo de sonda passiva em ms |
| `trialEnabled` | `true` | Banco de testes de ferramentas (aba de configurações + `/mcp call`) |
| `trialTimeoutMs` | `120000` | Prazo do painel por chamada de teste em ms |
| `trialMaxResultChars` | `60000` | Teto do payload do resultado de teste em caracteres |
| `writeEnabled` | `true` | Interruptor de segurança: `false` rejeita toda gravação (copiar continua funcionando) |
| `writeVerifyEnabled` | `true` | Re-verifica cada gravação contra o estado re-aplicado do loader antes de reportar sucesso |
| `writeVerifyTimeoutMs` | `3000` | Orçamento de sondagem para a verificação de gravação em ms |
| `backupCount` | `5` | Backups de `cordis.patch.yml` retidos por gravação |
| `catalogEntries` | `[]` | Sobreposição do usuário para o diretório recomendado: anexa entradas; uma entrada com o mesmo `id` substitui a integrada |

## Desenvolvimento

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

## Publicação

[ADR](docs/adr/) · [GitHub Releases](https://github.com/TTTPOB/dsh-mcp-panel/releases) · [Apache-2.0](LICENSE)

```sh
gh release download v0.6.24-fork2 --repo TTTPOB/dsh-mcp-panel --pattern "*.tgz"
dsh plugin --profile web add ./dsh-mcp-panel-0.6.24-fork2.tgz
```
