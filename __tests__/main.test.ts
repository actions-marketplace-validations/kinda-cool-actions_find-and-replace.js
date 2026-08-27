/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * To mock dependencies in ESM, you can create fixtures that export mock
 * functions and objects. For example, the core module is mocked in this test,
 * so that the actual '@actions/core' module is not imported.
 */
import * as core from '../__fixtures__/core.js'
import { vi, describe, afterEach, expect, test } from 'vitest'
import {
  parseRegexPatterns,
  parseInputFindAndReplaceFile,
  findAndReplace,
  DefaultExport
} from '../src/main.js'
import { getInput } from '@actions/core'
import { exit } from 'node:process'
import { globSync, readFileSync, writeFileSync } from 'node:fs'
import {
  fixtureFindAndReplaceFilesPath,
  fixtureReplaceTargetFiles
} from '../__fixtures__/utils.js'
import { basename, join } from 'node:path'

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
    readFileSync: vi.fn(),
    writeFileSync: vi.fn()
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
  test('parseRegexPatterns', async () => {
    // todo..
    const matches = globSync(fixtureFindAndReplaceFilesPath + '*.js')
    for (const match of matches) {
      const parsedRegex = await parseRegexPatterns(match)
      expect(DefaultExport.parse(parsedRegex).length).toBeGreaterThan(0)
    }
  })
  test('findAndReplace', async () => {
    const filename_to_regex: Record<string, DefaultExport> = {}
    console.log(process.cwd())
    const matches = globSync('./' + fixtureFindAndReplaceFilesPath + '*.js')
    for (const match of matches) {
      const path = join(process.cwd(), match)
      const module = await import(path)
      const defaultExport = module.default
      filename_to_regex[match] = DefaultExport.parse(defaultExport)
    }
    let i = 0
    const fake_filesystem: Record<string, string> = {}
    const readingFiles = globSync(fixtureReplaceTargetFiles + '*')
    vi.doUnmock(import('node:fs'))
    const { readFileSync: unmockedReadFile } = await import('node:fs')
    for (const file of readingFiles) {
      fake_filesystem[file] = unmockedReadFile(file, 'utf-8')
    }
    vi.mocked(readFileSync).mockImplementation((filename) => {
      return fake_filesystem[filename.toString()]
    })
    vi.mocked(writeFileSync).mockImplementation((filename, contents) => {
      fake_filesystem[filename.toString()] = contents.toString()
    })
    for (const key in filename_to_regex) {
      findAndReplace(filename_to_regex[key])
      for (let j = i; j < vi.mocked(writeFileSync).mock.calls.length; j++) {
        const calls = vi.mocked(writeFileSync).mock.calls
        expect(fake_filesystem[calls[j][0].toString()]).toMatchFileSnapshot(
          `__snapshots__/${basename(key, '.js')}/${basename(calls[j][0].toString())}`
        )
        i++
      }
    }
  })
})
