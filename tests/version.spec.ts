/**
 * Version-consistency tripwire: the probe's MCP `clientInfo.version` is
 * advertised on the wire, so it must track the package version or probe
 * handshakes claim a stale release. Bumping `package.json` without touching
 * `PROBE_CLIENT_INFO` fails this test.
 *
 * @module dsh-mcp-panel/test/version.spec
 */

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { PROBE_CLIENT_INFO } from '../src/probe.ts'

/** Read the package manifest next to this source tree. */
function packageVersion(): string {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string }
  return pkg.version
}

describe('probe clientInfo version', () => {
  it('validates the fork release tag and extracts its changelog section', () => {
    const options = { cwd: new URL('../', import.meta.url), encoding: 'utf8' as const, stdio: 'pipe' as const }
    const version = packageVersion()
    expect(execFileSync(process.execPath, ['scripts/check-tag-version.mjs', 'v' + version], options)).toContain(version)
    expect(execFileSync(process.execPath, ['scripts/changelog-section.mjs', version], options)).toContain('## [' + version + ']')
    expect(() => execFileSync(process.execPath, ['scripts/check-tag-version.mjs', 'v0.0.0-fork0'], options)).toThrow()
  })

  it('matches the package version', () => {
    expect(PROBE_CLIENT_INFO.version).toBe(packageVersion())
  })

  it('advertises the panel identity on the wire', () => {
    expect(PROBE_CLIENT_INFO.name).toBe('dsh-mcp-panel')
  })
})
