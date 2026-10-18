/** Real Loader configuration and lifecycle tests against isolated loopback services. */
import { createServer, type Server } from 'node:http'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import Include from '@deepseek-ai/cordis-plugin-include'
import * as mcpClient from '@deepseek-ai/dsh-mcp-client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountHarness } from './harness.ts'
import { probeEndpoint } from '../src/probe.ts'

const MCP = '@deepseek-ai/dsh-mcp-client'
const cleanups: Array<() => Promise<unknown>> = []
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup()
  vi.restoreAllMocks()
})

/** Resolve the installed client without Node-internal module-loader hooks. */
class FixtureInclude extends Include {
  override async import(name: string, stack?: () => string[]) {
    if (name === MCP) return mcpClient
    return super.import(name, stack)
  }
}

/** Import the real MCP plugin while retaining the real Loader/Include lifecycle. */
class FixtureLoader extends Loader {
  override async import(name: string, stack?: () => string[]) {
    if (name === MCP) return mcpClient
    if (name === 'fixture:include') return FixtureInclude
    return super.import(name, stack)
  }
}

async function fixture(configYaml: string) {
  const h = await mountHarness([], {}, undefined, FixtureLoader)
  const ctx = h.ctx
  const dir = await mkdtemp(join(tmpdir(), 'mcp-panel-loader-'))
  cleanups.push(() => rm(dir, { recursive: true, force: true }))
  cleanups.push(() => ctx.fiber.dispose())
  const file = join(dir, 'cordis.yml')
  await writeFile(file, `- id: target
  name: "${MCP}"
  config:
${configYaml}`)
  await ctx.loader.create({ name: 'fixture:include', config: { path: pathToFileURL(file).href } })
  await ctx.loader.await()
  for (const row of ctx.loader.entries()) await row.fiber?.await()
  const entry = [...ctx.loader.entries()].find(entry => entry.options.id === 'target')!
  expect(entry).toBeDefined()
  await entry.fiber?.await()
  return { ...h, file, entry }
}

async function listen(server: Server) {
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  cleanups.push(() => new Promise<void>(resolve => { server.closeAllConnections(); server.close(() => resolve()) }))
  const address = server.address()
  if (typeof address !== 'object' || address === null) throw new Error('missing loopback port')
  return 'http://127.0.0.1:' + address.port + '/mcp'
}

/** Minimal JSON-RPC MCP fixture; missing fake credentials are always rejected. */
async function endpoint() {
  const methods: string[] = []
  let allowed = true
  let rejected = 0
  const url = await listen(createServer(async (req, res) => {
    if (req.headers.authorization !== 'Bearer fixture-only-token') {
      res.writeHead(401).end(); return
    }
    if (!allowed) { rejected++; res.writeHead(503).end(); return }
    if (req.method !== 'POST') { res.writeHead(405).end(); return }
    let body = ''
    for await (const chunk of req) body += chunk
    const message = JSON.parse(body)
    methods.push(message.method)
    if (message.id === undefined) { res.writeHead(202).end(); return }
    const result = message.method === 'initialize'
      ? { protocolVersion: message.params.protocolVersion, capabilities: { tools: {} }, serverInfo: { name: 'fixture', version: '1' } }
      : message.method === 'tools/list'
        ? { tools: [{ name: 'echo', description: 'fixture echo', inputSchema: { type: 'object' } }] }
        : { content: [{ type: 'text', text: 'fixture-result' }] }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ jsonrpc: '2.0', id: message.id, result }))
  }))
  return { url, methods, get rejected() { return rejected }, reject: () => { allowed = false }, recover: () => { allowed = true } }
}

describe('real Loader effective MCP configuration', () => {
  it.each([
    `    headers:
      Authorization: !!js 'ctx.tools ? "Bearer fixture-only-token" : "missing-injection"'
`,
    `    headers: !!js '({ Authorization: "Bearer fixture-only-token" })'
`,
  ])('probes the evaluated header without leaking credentials (%s)', async headers => {
    const server = await endpoint()
    const h = await fixture(`    serverName: fixture
    transport: streamable-http
    url: ${server.url}
${headers}`)
    const target = h.service.probeSpec('fixture')
    expect(target?.kind).toBe('http')
    if (target?.kind !== 'http') throw new Error('missing effective target')
    const noAuth = await probeEndpoint(target.url, {}, 1000, new AbortController().signal)
    expect(noAuth.status).toBe('failed')
    expect(noAuth.detail).toContain('401')
    const outcome = await probeEndpoint(target.url, target.headers, 1000, new AbortController().signal)
    expect(outcome.status).toBe('completed')
    expect(JSON.stringify(h.service.status())).not.toContain('fixture-only-token')
    expect(JSON.stringify(outcome)).not.toContain('fixture-only-token')
    expect(h.entry.options.config.headers).not.toEqual(target.headers)
  })

  it('uses whole-map env expressions from the activated plugin config', async () => {
    const h = await fixture(`    serverName: cli
    transport: stdio
    command: ${process.execPath}
    args: ["-e", "process.exit(0)"]
    env: !!js '({ FIXTURE_TOKEN: "fake-env-token" })'
    reconnect:
      enabled: false
`)
    expect(h.service.probeSpec('cli')).toMatchObject({ kind: 'stdio', env: { FIXTURE_TOKEN: 'fake-env-token' } })
    expect(JSON.stringify(h.service.status())).not.toContain('fake-env-token')
  })

  it('restarts a real client after failed initialization and restores the official tool pipeline without writing config', async () => {
    const server = await endpoint()
    server.reject()
    const schedule = vi.spyOn(globalThis, 'setTimeout')
    const clear = vi.spyOn(globalThis, 'clearTimeout')
    const h = await fixture(`    serverName: fixture
    transport: streamable-http
    url: ${server.url}
    headers: { Authorization: "Bearer fixture-only-token" }
    reconnect:
      initialDelayMs: 5000
      maxDelayMs: 5000
      maxAttempts: 1
`)
    const original = await readFile(h.file, 'utf8')
    const write = vi.spyOn(h.entry.parent.tree, 'write')
    expect(h.ctx.tools.schemas().some(tool => tool.name === 'mcp__fixture__echo')).toBe(false)
    const retryIndex = schedule.mock.calls.findIndex(args => args[1] === 5000)
    expect(retryIndex).toBeGreaterThanOrEqual(0)
    const retryTimer = schedule.mock.results[retryIndex]!.value
    server.recover()
    expect(await h.service.reconnect('target')).toEqual({ entryId: 'target', accepted: true, reloaded: true })
    expect(h.ctx.tools.schemas().filter(tool => tool.name === 'mcp__fixture__echo')).toHaveLength(1)
    const result = await h.service.callTool(JSON.stringify({ serverName: 'fixture', toolName: 'mcp__fixture__echo', argsJson: '{}' }), h.session.id)
    expect(result.isError).toBe(false)
    expect(result.resultJson).toContain('fixture-result')
    expect(clear).toHaveBeenCalledWith(retryTimer)
    expect(write).not.toHaveBeenCalled()
    expect(await readFile(h.file, 'utf8')).toBe(original)
    expect(h.entry.options.disabled).not.toBe(true)
    // A second reload cleans the live generation before registering its replacement.
    await h.service.reconnect('target')
    expect(h.ctx.tools.schemas().filter(tool => tool.name === 'mcp__fixture__echo')).toHaveLength(1)
    expect(server.methods.filter(method => method === 'initialize')).toHaveLength(2)
  })

  it('recovers an exhausted automatic reconnect budget with a fresh client instance', async () => {
    const server = await endpoint()
    server.reject()
    const h = await fixture(`    serverName: fixture
    transport: streamable-http
    url: ${server.url}
    headers: { Authorization: "Bearer fixture-only-token" }
    reconnect:
      initialDelayMs: 10
      maxDelayMs: 10
      maxAttempts: 1
`)
    // One initial failure and one automatic retry consume the entire budget.
    await new Promise(resolve => setTimeout(resolve, 80))
    expect(server.rejected).toBe(2)
    server.recover()
    await new Promise(resolve => setTimeout(resolve, 40))
    expect(server.methods).toEqual([])
    const before = await readFile(h.file, 'utf8')
    await h.service.reconnect('target')
    expect(server.methods.filter(method => method === 'initialize')).toHaveLength(1)
    expect(h.ctx.tools.schemas().filter(tool => tool.name === 'mcp__fixture__echo')).toHaveLength(1)
    expect(await readFile(h.file, 'utf8')).toBe(before)
  })
})
