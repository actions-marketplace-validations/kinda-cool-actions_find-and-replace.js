/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * To mock dependencies in ESM, you can create fixtures that export mock
 * functions and objects. For example, the core module is mocked in this test,
 * so that the actual '@actions/core' module is not imported.
 */
import * as core from '../__fixtures__/core.js'
import { vi, describe, beforeEach, it, afterEach, expect, test } from 'vitest'
import {
  run,
  parseRegexPatterns,
  parseInputFindAndReplaceFile,
  findAndReplace,
  InputDefaultExport
} from '../src/main.js'
import { getInput } from '@actions/core'
import { exit } from 'node:process'
import { readFileSync, writeFileSync } from 'node:fs'
import {
  fixtureFindAndReplaceFilesPath,
  fixtureReplaceTargetFiles
} from '../__fixtures__/utils.js'

// Mocks should be declared before the module being tested is imported.
vi.mock(import('@actions/core'), () => core)
vi.mock(import('node:process'), async (orig) => {
  const mod = await orig()
  return {
    ...mod,
    exit: vi.fn<typeof exit>(() => {
      throw Error('exit')
    })
  }
})
vi.mock(import('node:fs'), async (importOriginal) => {
  const mod = await importOriginal()
  return {
    ...mod,
    readFileSync: vi.fn()
  }
})

describe('main.ts', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })
  test('parseInputFindAndReplaceFile', () => {
    vi.mocked(getInput).mockImplementationOnce(() => 'patterns.js')
    expect(parseInputFindAndReplaceFile()).toBe('patterns.js')
    vi.mocked(getInput).mockImplementationOnce(() => 'hi.txt')
    expect(parseInputFindAndReplaceFile).toThrow('exit')
  })
  test('parseRegexPatterns', () => {
    // todo..
  })
})
describe('main.tsa', () => {
  beforeEach(() => {
    // Set the action's inputs as return values from core.getInput().
    core.getInput.mockImplementation(() => '500')
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('Sets the time output', async () => {
    await run()

    // Verify the time output was set.
    expect(core.setOutput).toHaveBeenNthCalledWith(
      1,
      'time',
      // Simple regex to match a time string in the format HH:MM:SS.
      expect.stringMatching(/^\d{2}:\d{2}:\d{2}/)
    )
  })

  it('Sets a failed status', async () => {
    // Clear the getInput mock and return an invalid value.
    core.getInput.mockClear().mockReturnValueOnce('this is not a number')
    await run()

    // Verify that the action was marked as failed.
    expect(core.setFailed).toHaveBeenNthCalledWith(
      1,
      'milliseconds is not a number'
    )
  })
})
