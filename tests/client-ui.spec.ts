// @vitest-environment jsdom
/** Isolated settings interaction tests; all remote calls are fake. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { McpPanelTab, type McpPanelTabInjected, type McpPanelTabProps } from '../src/client/McpPanelTab.tsx'
import { en, zh } from '../src/client/locales.ts'
import { installPanelStyles } from '../src/client/styles.ts'
import type { McpPanelSnapshot, McpServerView, ReconnectResult } from '../src/wire.ts'

function server(entryId = 'first', enabled = true): McpServerView {
  return {
    entryId, serverName: 'same-name', enabled, transport: 'streamable-http', target: 'https://fixture.invalid/mcp',
    fiberPhase: 'active', configuredNote: null, toolCount: 0, tools: [], phase: 'unknown', attempt: -1,
    maxAttempts: -1, delayMs: null, reconnectCount: -1, lastError: null, connectedAt: null, observedAt: null,
    probeState: null, probeCheckedAt: null, statusSource: 'derived', config: null, diagnostics: [], exitCode: null, stderrTail: null,
  }
}
function snapshot(servers = [server()], refreshIntervalMs = 0): McpPanelSnapshot {
  return {
    servers, probes: [], observed: false, patchFile: null, refreshIntervalMs,
    capabilities: { resources: { available: false }, prompts: { available: false } },
    trial: { enabled: false, timeoutMs: 1000, maxResultChars: 1000 }, writeEnabled: false, catalog: [],
  }
}
function actions(): McpPanelTabInjected {
  return {
    status: vi.fn(async () => snapshot()),
    reconnect: vi.fn(async entryId => ({ entryId, accepted: true, reloaded: true })),
    probe: vi.fn(async () => ({ jobId: 'fixture-probe', note: 'fixture only' })),
    previewPatch: vi.fn(), writePatch: vi.fn(), callTool: vi.fn(),
  }
}
let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
let disposeStyles: () => void
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.useFakeTimers()
  Object.defineProperty(document, 'hidden', { configurable: true, value: false })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  disposeStyles = installPanelStyles()
})
afterEach(async () => {
  await act(async () => { root.unmount() })
  disposeStyles()
  container.remove()
  vi.useRealTimers()
})
async function mount(injected = actions(), dictionary = en): Promise<void> {
  const props = { ...injected, t: (key: keyof typeof en) => dictionary[key] } as McpPanelTabProps
  await act(async () => { root.render(createElement(McpPanelTab, props)) })
}
function button(text: string, parent: ParentNode = container): HTMLButtonElement {
  const found = [...parent.querySelectorAll('button')].find(item => item.textContent === text)
  if (!found) throw new Error('Missing button: ' + text)
  return found
}
async function click(element: HTMLElement): Promise<void> {
  await act(async () => { element.click() })
}

describe('MCP Settings recovery and connection actions', () => {
  it('retains the snapshot after a polling failure and recovers on the next interval', async () => {
    const injected = actions()
    injected.status = vi.fn().mockResolvedValueOnce(snapshot([server()], 1000))
      .mockRejectedValueOnce(new Error('fixture offline')).mockResolvedValue(snapshot([server()], 1000))
    await mount(injected)
    await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
    expect(container.querySelectorAll('.dmcp-card')).toHaveLength(1)
    expect(container.textContent).toContain(en.refreshFailed)
    expect(button(en.refreshStatus).disabled).toBe(false)
    await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
    expect(injected.status).toHaveBeenCalledTimes(3)
    expect(container.textContent).not.toContain('fixture offline')
  })
  it('does not replace a slow pending status request with polling ticks', async () => {
    const injected = actions()
    let resolve!: (value: McpPanelSnapshot) => void
    injected.status = vi.fn().mockResolvedValueOnce(snapshot([server()], 1000))
      .mockImplementationOnce(() => new Promise<McpPanelSnapshot>(done => { resolve = done }))
    await mount(injected)
    await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
    expect(button(en.refreshing).disabled).toBe(true)
    await act(async () => { await vi.advanceTimersByTimeAsync(4000) })
    expect(injected.status).toHaveBeenCalledTimes(2)
    await act(async () => { resolve(snapshot()) })
    expect(button(en.refreshStatus).disabled).toBe(false)
  })
  it('retries an initial status failure without losing the top-level refresh action', async () => {
    const injected = actions()
    injected.status = vi.fn().mockRejectedValueOnce(new Error('fixture failure')).mockResolvedValue(snapshot())
    await mount(injected)
    expect(container.textContent).toContain(en.error)
    await click(button(en.refreshStatus))
    expect(container.querySelector('.dmcp-card')).not.toBeNull()
    expect(container.textContent).not.toContain('fixture failure')
  })
  it('targets duplicate server names by entry id and shows pending and non-health success', async () => {
    const injected = actions()
    injected.status = vi.fn(async () => snapshot([server('first'), server('second'), server('disabled', false)]))
    let resolve!: (value: ReconnectResult) => void
    injected.reconnect = vi.fn(() => new Promise<ReconnectResult>(done => { resolve = done }))
    await mount(injected)
    const first = container.querySelector('[data-mcp-entry="first"]')!
    const second = container.querySelector('[data-mcp-entry="second"]')!
    const disabled = container.querySelector('[data-mcp-entry="disabled"]')!
    expect(button(en.reconnectNow, disabled).disabled).toBe(true)
    await click(button(en.reconnectNow, second))
    expect(injected.reconnect).toHaveBeenCalledWith('second')
    expect(button(en.reconnectPending, second).disabled).toBe(true)
    expect(button(en.reconnectNow, first).disabled).toBe(false)
    await act(async () => { resolve({ entryId: 'second', accepted: true, reloaded: true }) })
    expect(second.textContent).toContain(en.reconnectStarted)
    expect(second.querySelector('.dmcp-badge')?.textContent).toContain(en.statusUnknown)
    expect(container.textContent).toContain(en.derivedNote)
    expect(injected.status).toHaveBeenCalledTimes(2)
    expect(injected.probe).not.toHaveBeenCalled()
  })
  it('shows reconnect failures on the affected entry and permits retry', async () => {
    const injected = actions()
    injected.reconnect = vi.fn().mockRejectedValue(new Error('fixture restart rejected'))
    await mount(injected, zh)
    await click(button(zh.reconnectNow))
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('fixture restart rejected')
    expect(button(zh.reconnectNow).disabled).toBe(false)
    expect(injected.status).toHaveBeenCalledTimes(1)
  })
  it('refresh and probe remain distinct from reconnect and details are label/value rows', async () => {
    const injected = actions()
    await mount(injected)
    await click(button(en.refreshStatus))
    expect(injected.reconnect).not.toHaveBeenCalled()
    await click(container.querySelector<HTMLButtonElement>('.dmcp-card-content')!)
    for (const row of container.querySelectorAll('.dmcp-details > div')) {
      expect(row.children[0]?.tagName).toBe('DT')
      expect(row.children[1]?.tagName).toBe('DD')
    }
    await click(button(en.probeNow))
    expect(injected.probe).toHaveBeenCalledWith('same-name')
    expect(injected.reconnect).not.toHaveBeenCalled()
  })
  it('styles the root itself and puts each definition row in its own grid', async () => {
    await mount()
    const sheet = document.querySelector<HTMLStyleElement>('style[data-dsh-mcp-panel]')!.sheet!
    const rules = [...sheet.cssRules].filter((rule): rule is CSSStyleRule => 'selectorText' in rule)
    const rootRule = rules.find(rule => rule.selectorText === '[data-dsh-mcp-panel].dmcp-section')!
    expect(container.firstElementChild?.matches(rootRule.selectorText)).toBe(true)
    expect(rootRule.style.display).toBe('flex')
    expect(rules.find(rule => rule.selectorText === '[data-dsh-mcp-panel] .dmcp-details > div')?.style.display).toBe('grid')
  })
})
