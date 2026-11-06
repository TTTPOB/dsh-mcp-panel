/** Panel trials execute native exceptions through the Agent's real PTC scope. */
import { afterEach, describe, expect, it } from 'vitest'
import { createScope } from '@deepseek-ai/dsh-scope'
import * as ptcExecutor from '@deepseek-ai/dsh-tool-executor-ptc'
import { mountHarness, type Harness } from './harness.ts'
import { createTrialCaller, RESOURCE_TOOL_NAMES } from '../src/trial.ts'

let harness: Harness | undefined
afterEach(async () => { await harness?.ctx.fiber.dispose() })

describe.skipIf(process.env.DSH_FORK_PTC_NATIVE !== '1')('fork PTC panel trials', () => {
  it.each(['mcp__demo__echo', ...RESOURCE_TOOL_NAMES])('directly executes %s only when admitted as a native exception', async toolName => {
    const h = harness = await mountHarness()
    h.ctx.provide('ptcRuntime', {
      language: 'typescript', isolation: 'trial-fixture',
      run: async () => { throw new Error('Native trial must not enter the PTC runtime') },
    } as never)
    const seen: unknown[] = []
    h.ctx.tools.register({
      name: toolName, description: 'Trial echo', parameters: {},
      output: { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: String(value) }] },
      execute: async args => { seen.push(args); return 'trial result' },
    })
    const scoped = createScope(h.ctx, h.agent)
    Object.assign(h.agent, { ctx: scoped.ctx })
    const executor = await scoped.ctx.plugin(ptcExecutor, { ptcNativeTools: [] })
    const input = { serverName: 'demo', toolName, argsJson: JSON.stringify({ who: 'panel' }) }
    const limits = { timeoutMs: 1000, maxResultChars: 2000 }
    const caller = createTrialCaller()
    const run = () => caller.runTrialCall(h.ctx.tools, { get: () => h.agent }, h.session.id, input, limits)
    expect((await run()).isError).toBe(true)
    expect(seen).toEqual([])
    await executor.dispose()
    await scoped.ctx.plugin(ptcExecutor, { ptcNativeTools: [toolName] })
    const before = h.session.snapshotEvents().length
    const result = await run()
    expect(result.isError).toBe(false)
    expect(JSON.parse(result.resultJson).value).toBe('trial result')
    expect(seen).toEqual([toolName.startsWith('mcp__') ? { who: 'panel' } : { who: 'panel', server: input.serverName }])
    expect(h.session.snapshotEvents().length).toBe(before)
  })
})
