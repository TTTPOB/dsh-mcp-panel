/**
 * Scoped stylesheet for the MCP tab. Standalone client bundles cannot use the
 * in-repo CSS-module pipeline, so the sheet ships as a string and is
 * installed effect-scoped into a `<style data-dsh-mcp-panel>` element.
 * Every selector is scoped under `[data-dsh-mcp-panel]` and uses theme
 * design tokens only, so it follows both color schemes.
 *
 * @module dsh-mcp-panel/client/styles
 */

/** Live installations of the panel stylesheet (one element, many mounts). */
let liveInstalls = 0

/**
 * One `<style>` installation; returns the exact disposer that releases it.
 * Ownership is counted across mounts: the element is created once, any live
 * install keeps it, and only the last disposer removes it — an earlier unmount
 * can no longer pull the sheet out from under a surviving mount, and the
 * disposer is idempotent.
 */
export function installPanelStyles(): () => void {
  let disposed = false
  liveInstalls += 1
  let element = document.querySelector<HTMLStyleElement>('style[data-dsh-mcp-panel]')
  if (element === null) {
    element = document.createElement('style')
    element.dataset.dshMcpPanel = ''
    element.textContent = PANEL_CSS
    document.head.append(element)
  }
  return () => {
    if (disposed) return
    disposed = true
    liveInstalls -= 1
    if (liveInstalls <= 0) {
      liveInstalls = 0
      element?.remove()
    }
  }
}

/** The panel stylesheet, scoped and token-driven. */
const PANEL_CSS = `
[data-dsh-mcp-panel].dmcp-section {
  display: flex; flex-direction: column; gap: 20px; min-width: 0;
  color: var(--dsw-alias-label-primary); line-height: 1.5;
}
[data-dsh-mcp-panel] *, [data-dsh-mcp-panel] *::before, [data-dsh-mcp-panel] *::after { box-sizing: border-box; }
[data-dsh-mcp-panel] :is(.dmcp-panel, .dmcp-card-details, .dmcp-editor, .dmcp-form, .dmcp-patch, .dmcp-trial, .dmcp-resources, .dmcp-trial-result, .dmcp-capabilities) {
  display: flex; flex-direction: column; gap: 12px; min-width: 0;
}
[data-dsh-mcp-panel] :is(.dmcp-topbar, .dmcp-toolbar, .dmcp-editor-actions, .dmcp-trial-row, .dmcp-trial-meta) {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
[data-dsh-mcp-panel] .dmcp-topbar { justify-content: space-between; gap: 12px; }
[data-dsh-mcp-panel] .dmcp-heading { margin: 0; font-size: 1em; font-weight: 600; }
[data-dsh-mcp-panel] :is(.dmcp-summary, .dmcp-status, .dmcp-notice, .dmcp-derived-note, .dmcp-patch-hint, .dmcp-health-title, .dmcp-failure-detail, .dmcp-trial-meta) {
  margin: 0; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere;
}
[data-dsh-mcp-panel] .dmcp-summary { margin-top: 4px; font-size: .9em; }
[data-dsh-mcp-panel] :is(button, input, select, textarea) { font: inherit; }
[data-dsh-mcp-panel] :is(.dmcp-action, .dmcp-probe-now) {
  display: inline-flex; align-items: center; justify-content: center; min-height: 36px;
  padding: 7px 12px; border: 1px solid var(--dsw-alias-border-l3); border-radius: 7px;
  background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary);
  cursor: pointer; line-height: 1.25; transition: background .15s, border-color .15s;
}
[data-dsh-mcp-panel] button:not(:disabled):hover { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-label-tertiary); }
[data-dsh-mcp-panel] :is(button, input, select, textarea):focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px;
}
[data-dsh-mcp-panel] button:disabled { opacity: .5; cursor: not-allowed; }
[data-dsh-mcp-panel] button[aria-busy='true'] { cursor: progress; }
[data-dsh-mcp-panel] .dmcp-primary { color: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); font-weight: 600; }
[data-dsh-mcp-panel] .dmcp-danger { color: var(--dsw-alias-state-error-primary); }
[data-dsh-mcp-panel] .dmcp-confirm { color: var(--dsw-alias-state-warn-primary); border-color: currentColor; }
[data-dsh-mcp-panel] :is(input:not([type='checkbox']), select, textarea) {
  min-height: 36px; min-width: 0; max-width: 100%; padding: 7px 10px;
  border: 1px solid var(--dsw-alias-border-l3); border-radius: 7px;
  background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary);
}
[data-dsh-mcp-panel] textarea { resize: vertical; }
[data-dsh-mcp-panel] .dmcp-server-filter { flex: 1 1 220px; }
[data-dsh-mcp-panel] :is(.dmcp-cards, .dmcp-tools, .dmcp-probes, .dmcp-capabilities-list) { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
[data-dsh-mcp-panel] :is(.dmcp-card, .dmcp-editor) { border: 1px solid var(--dsw-alias-border-l3); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); overflow: hidden; }
[data-dsh-mcp-panel] .dmcp-card-header { display: flex; align-items: center; gap: 8px; padding-right: 14px; }
[data-dsh-mcp-panel] .dmcp-card-header > .dmcp-action { flex-shrink: 0; white-space: nowrap; }
[data-dsh-mcp-panel] .dmcp-probe-now { align-self: flex-start; }
[data-dsh-mcp-panel] .dmcp-card-content {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  width: 100%; min-width: 0; padding: 14px 16px; text-align: left; border: 0;
  background: transparent; color: inherit; cursor: pointer;
}
[data-dsh-mcp-panel] .dmcp-chevron { color: var(--dsw-alias-label-tertiary); flex-shrink: 0; }
[data-dsh-mcp-panel] .dmcp-card-identity { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }
[data-dsh-mcp-panel] .dmcp-card-title { overflow-wrap: anywhere; }
[data-dsh-mcp-panel] .dmcp-card-target { color: var(--dsw-alias-label-secondary); font-size: .85em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
[data-dsh-mcp-panel] .dmcp-card-trailing { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
[data-dsh-mcp-panel] .dmcp-tool-count { color: var(--dsw-alias-label-secondary); white-space: nowrap; font-size: .9em; }
[data-dsh-mcp-panel] .dmcp-card-feedback { padding: 0 16px 12px; }
[data-dsh-mcp-panel] .dmcp-card-details { border-top: 1px solid var(--dsw-alias-border-l2); padding: 16px; }
[data-dsh-mcp-panel] .dmcp-details { margin: 0; display: flex; flex-direction: column; gap: 8px; }
[data-dsh-mcp-panel] .dmcp-details > div { display: grid; grid-template-columns: minmax(100px, 26%) minmax(0, 1fr); gap: 12px; }
[data-dsh-mcp-panel] .dmcp-details dt { color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
[data-dsh-mcp-panel] .dmcp-details dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
[data-dsh-mcp-panel] .dmcp-error-text { color: var(--dsw-alias-state-error-primary); overflow-wrap: anywhere; margin: 0; }
[data-dsh-mcp-panel] .dmcp-warn-text { color: var(--dsw-alias-state-warn-primary); }
[data-dsh-mcp-panel] .dmcp-target { color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
[data-dsh-mcp-panel] .dmcp-tools li { display: flex; flex-direction: column; gap: 3px; overflow-wrap: anywhere; padding: 8px 0; border-bottom: 1px solid var(--dsw-alias-border-l2); }
[data-dsh-mcp-panel] :is(.dmcp-tool-description, .dmcp-probe-detail) { color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
[data-dsh-mcp-panel] :is(.dmcp-probe-time, .dmcp-diag-code, .dmcp-trial-call) { color: var(--dsw-alias-label-tertiary); font-size: .85em; }
[data-dsh-mcp-panel] :is(.dmcp-probe, .dmcp-capabilities-list li) { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
[data-dsh-mcp-panel] .dmcp-probe { padding: 12px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; }
[data-dsh-mcp-panel] .dmcp-probe-detail { flex: 1 1 100%; }
[data-dsh-mcp-panel] .dmcp-badge { display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 999px; font-size: .8em; white-space: nowrap; border: 1px solid currentColor; }
[data-dsh-mcp-panel] .dmcp-badge[data-tone='ok'] { color: var(--dsw-alias-state-success-primary); }
[data-dsh-mcp-panel] .dmcp-badge[data-tone='warn'] { color: var(--dsw-alias-state-warn-primary); }
[data-dsh-mcp-panel] .dmcp-badge[data-tone='error'] { color: var(--dsw-alias-state-error-primary); }
[data-dsh-mcp-panel] .dmcp-badge[data-tone='muted'] { color: var(--dsw-alias-label-tertiary); }
[data-dsh-mcp-panel] .dmcp-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
[data-dsh-mcp-panel] .dmcp-editor { padding: 16px; }
[data-dsh-mcp-panel] .dmcp-field { display: flex; flex-direction: column; gap: 6px; color: var(--dsw-alias-label-secondary); min-width: 0; }
[data-dsh-mcp-panel] .dmcp-check { display: flex; align-items: center; gap: 8px; color: var(--dsw-alias-label-secondary); }
[data-dsh-mcp-panel] .dmcp-map { border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; padding: 10px; margin: 0; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
[data-dsh-mcp-panel] .dmcp-map legend { color: var(--dsw-alias-label-secondary); padding: 0 4px; }
[data-dsh-mcp-panel] .dmcp-map-row { display: flex; gap: 8px; }
[data-dsh-mcp-panel] .dmcp-map-key { flex: 1 1 40%; width: 0; }
[data-dsh-mcp-panel] .dmcp-map-value { flex: 2 1 60%; width: 0; }
[data-dsh-mcp-panel] .dmcp-fragment { margin: 0; padding: 12px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; background: var(--dsw-alias-bg-layer-2); overflow: auto; max-height: 320px; white-space: pre-wrap; overflow-wrap: anywhere; font-family: var(--dsw-alias-font-mono, monospace); font-size: .85em; }
[data-dsh-mcp-panel] .dmcp-health-list { margin: 0; padding-left: 20px; }
[data-dsh-mcp-panel] :is(.dmcp-remove, .dmcp-failure) { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 12px; border: 1px solid var(--dsw-alias-state-error-primary); border-radius: 8px; }
[data-dsh-mcp-panel] .dmcp-failure p { margin: 0; }
[data-dsh-mcp-panel] :is(.dmcp-trial, .dmcp-resources, .dmcp-capabilities) { border-top: 1px solid var(--dsw-alias-border-l2); padding-top: 20px; margin-top: 4px; }
[data-dsh-mcp-panel] .dmcp-trial-row { align-items: flex-end; }
[data-dsh-mcp-panel] .dmcp-trial-row .dmcp-field { flex: 1 1 180px; }
[data-dsh-mcp-panel] .dmcp-resource-uri { flex: 1 1 180px; }
@media (max-width: 560px) {
  [data-dsh-mcp-panel] .dmcp-topbar { align-items: flex-start; flex-direction: column; }
  [data-dsh-mcp-panel] .dmcp-card-header { align-items: stretch; flex-wrap: wrap; padding: 0 12px 12px; }
  [data-dsh-mcp-panel] .dmcp-card-header > .dmcp-action { margin-left: 4px; }
  [data-dsh-mcp-panel] .dmcp-card-content { flex-wrap: wrap; padding: 12px 4px; gap: 8px; }
  [data-dsh-mcp-panel] .dmcp-card-identity { max-width: 100%; }
  [data-dsh-mcp-panel] .dmcp-card-trailing { justify-content: flex-start; flex-basis: 100%; }
  [data-dsh-mcp-panel] .dmcp-details > div { grid-template-columns: minmax(80px, 32%) minmax(0, 1fr); gap: 8px; }
  [data-dsh-mcp-panel] .dmcp-map-row { flex-wrap: wrap; }
  [data-dsh-mcp-panel] .dmcp-map-row input { flex-basis: calc(50% - 4px); }
}
`
