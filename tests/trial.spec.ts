/** Trial calls retain policy, Agent scope, error projection, and panel-only logging. */
import { afterEach, describe, expect, it } from 'vitest'
import { mountHarness, mcpRow, type Harness } from './harness.ts'
import { createTrialCaller } from '../src/trial.ts'

const mounted: Harness[] = []
afterEach(async () => { for (const h of mounted.splice(0)) await h.ctx.fiber.dispose() })

async function fixture() {
  const h = await mountHarness([mcpRow('demo', { serverName: 'demo', transport: 'stdio', command: 'node' })])
  mounted.push(h)
  return h
}
const request = { serverName: 'demo', toolName: 'mcp__demo__echo', argsJson: JSON.stringify({ who: 'panel' }) }
const limits = { timeoutMs: 1000, maxResultChars: 2000 }

describe('trial batch execution', () => {
  it('forwards the Agent and parsed arguments through policy without logging a model response', async () => {
    const h = await fixture()
    const seen: unknown[] = []
    h.ctx.tools.register({
      name: request.toolName, description: 'Echo', parameters: {},
      output: { schema: { type: 'null' }, render: () => [] },
      execute: async args => { seen.push(args); return null },
    })
    let policyAgent: unknown
    h.ctx.on('tools/pre-execute', async (exec, next) => { policyAgent = exec.agent; return next() })
    const before = h.session.snapshotEvents().length
    const result = await createTrialCaller().runTrialCall(h.ctx.tools, { get: () => h.agent }, h.session.id, request, limits)
    expect(result.isError).toBe(false)
    expect(seen).toEqual([JSON.parse(request.argsJson)])
    expect(policyAgent).toBe(h.agent)
    expect(h.session.snapshotEvents().length).toBe(before)
  })

  it('returns a denial from the batch result without executing the body', async () => {
    const h = await fixture()
    let executed = false
    h.ctx.tools.register({
      name: request.toolName, description: 'Echo', parameters: {},
      output: { schema: { type: 'null' }, render: () => [] },
      execute: async () => { executed = true; return null },
    })
    const reason = 'fixture policy denied this trial'
    h.ctx.on('tools/pre-execute', async () => ({ kind: 'deny', reason }))
    const result = await h.service.callTool(JSON.stringify(request), undefined)
    expect(executed).toBe(false)
    expect(result.isError).toBe(true)
    expect(JSON.parse(result.resultJson).error.message).toContain(reason)
  })

  it('projects thrown tool failures instead of reporting success', async () => {
    const h = await fixture()
    const failure = 'fixture backend failed'
    h.ctx.tools.register({
      name: request.toolName, description: 'Echo', parameters: {},
      output: { schema: { type: 'null' }, render: () => [] },
      execute: async () => { throw new Error(failure) },
    })
    const result = await h.service.callTool(JSON.stringify(request), undefined)
    expect(result.isError).toBe(true)
    expect(JSON.parse(result.resultJson).error.message).toContain(failure)
  })

  it('does not admit step-conditional tools from a standalone panel trial', async () => {
    const h = await fixture()
    let executed = false
    h.ctx.tools.register({
      name: request.toolName, description: 'Conditional', parameters: {},
      output: { schema: { type: 'null' }, render: () => [] },
      execute: async () => { executed = true; return null },
    }, { when: () => true })
    const result = await h.service.callTool(JSON.stringify(request), undefined)
    expect(result.isError).toBe(true)
    expect(executed).toBe(false)
  })
})
