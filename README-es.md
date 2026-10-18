# dsh-mcp-panel

Este es el fork personal de TTTPOB de [PerryLink/dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel), basado en 0.6.24. Gestiona el cliente MCP oficial desde Ajustes → Plugins → MCP.

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

## Uso

Reconectar reinicia solo el plugin MCP habilitado seleccionado mediante Cordis Fiber.restart(): cierra la conexión anterior y reinicia el presupuesto de reintentos sin cambiar la configuración. La confirmación indica que se reinició el plugin, no que el servidor esté conectado. Las filas deshabilitadas se habilitan por separado.

Actualizar obtiene la instantánea de estado. La sonda realiza otro handshake HTTP o stdio con la configuración evaluada del plugin activo, incluidos headers y variables de entorno dinámicos. Ninguna de estas operaciones reconecta el cliente. Si falla la actualización, se conserva la última instantánea; el estado no observado sigue siendo desconocido.

```text
/mcp
/mcp <server> tools
/mcp <server> health
/mcp <server> call <tool> [json]
```

## Configuration

| Clave | Por defecto | Significado |
|---|---|---|
| `probeEnabled` | `true` | Registra la herramienta `mcp_probe` (resultados solo del panel) |
| `probeTimeoutMs` | `10000` | Tiempo límite por sonda en ms |
| `maxProbes` | `10` | Registros de sonda mostrados en el panel |
| `refreshIntervalMs` | `0` | Refresco sugerido del panel en ms; `0` = bajo demanda |
| `outputLanguage` | `en` | Idioma de salida de `/mcp`: `en \| zh \| es \| pt \| hi` |
| `passiveProbeEnabled` | `false` | Sondear periódicamente servidores streamable-http |
| `passiveProbeIntervalMs` | `60000` | Intervalo de sonda pasiva en ms |
| `trialEnabled` | `true` | Banco de pruebas de herramientas (pestaña de ajustes + `/mcp call`) |
| `trialTimeoutMs` | `120000` | Plazo del panel por llamada de prueba en ms |
| `trialMaxResultChars` | `60000` | Tope del payload de resultado de prueba en caracteres |
| `writeEnabled` | `true` | Interruptor de seguridad: `false` rechaza toda escritura (copiar sigue funcionando) |
| `writeVerifyEnabled` | `true` | Re-verifica cada escritura contra el estado re-aplicado del loader antes de reportar éxito |
| `writeVerifyTimeoutMs` | `3000` | Presupuesto de sondeo para la verificación de escritura en ms |
| `backupCount` | `5` | Copias de `cordis.patch.yml` retenidas por escritura |
| `catalogEntries` | `[]` | Superposición de usuario para el directorio recomendado: anexa entradas; una entrada con el mismo `id` reemplaza la integrada |

## Desarrollo

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

## Publicación

[ADR](docs/adr/) · [GitHub Releases](https://github.com/TTTPOB/dsh-mcp-panel/releases) · [Apache-2.0](LICENSE)

```sh
gh release download v0.6.24-fork1 --repo TTTPOB/dsh-mcp-panel --pattern "*.tgz"
dsh plugin --profile web add ./dsh-mcp-panel-0.6.24-fork1.tgz
```
