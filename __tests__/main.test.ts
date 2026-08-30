/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * To mock dependencies in ESM, you can create fixtures that export mock
 * functions and objects. For example, the core module is mocked in this test,
 * so that the actual '@actions/core' module is not imported.
 */
import * as coreFixtures from '../__fixtures__/core.js'
import { vi, describe, afterEach, expect, test } from 'vitest'
import {
  parseRegexPatterns,
  parseInputFindAndReplaceFile,
  findAndReplace,
  printJobSummary,
  setOutput,
  DefaultExport,
  FileModifications
} from '../src/main.js'
import { getInput } from '@actions/core'
import { exit } from 'node:process'
import { globSync, readFileSync, writeFileSync } from 'node:fs'
import {
  fixtureFindAndReplaceFilesPath,
  fixtureReplaceTargetFiles
} from '../__fixtures__/utils.js'
import { basename, join } from 'node:path'
import { createPatch } from 'diff'
import * as core from '@actions/core'

// Mocks should be declared before the module being tested is imported.
vi.mock(import('@actions/core'), async (importOriginal) => {
  const mod = await importOriginal()
  return {
    ...mod,
    ...coreFixtures
  }
})

// mock exit function to avoid exitting tests
vi.mock(import('node:process'), async (orig) => {
  const mod = await orig()
  return {
    ...mod,
    exit: vi.fn<typeof exit>(() => {
      throw Error('exit')
    })
  }
})

// mock read and write file functions to create repeatable snapshots
vi.mock(import('node:fs'), async (importOriginal) => {
  const mod = await importOriginal()
  return {
    ...mod,
    readFileSync: vi.fn(),
    writeFileSync: vi.fn()
  }
})

describe('main.ts', () => {
  // reset mock implementations and call history
  afterEach(() => {
    vi.resetAllMocks()
  })

  test('parseInputFindAndReplaceFile', () => {
    // simply using JS filename (no actual file needed)
    vi.mocked(getInput).mockImplementationOnce(() => 'patterns.js')
    expect(parseInputFindAndReplaceFile()).toBe('patterns.js')
    vi.mocked(getInput).mockImplementationOnce(() => 'hi.txt')
    expect(parseInputFindAndReplaceFile).toThrow('exit')
  })

  test('parseRegexPatterns', async () => {
    // get all fxiture js files
    const matches = globSync(fixtureFindAndReplaceFilesPath + '*.js')
    for (const match of matches) {
      const parsedRegex = await parseRegexPatterns(match)
      expect(parsedRegex).toBeTruthy()
      // check that parsedRegex was correctly parsed
      expect(DefaultExport.parse(parsedRegex)).toStrictEqual(parsedRegex)
    }
    // check that a default export with the wrong shape throws an error
    await expect(() =>
      parseRegexPatterns('__fixtures__/badFindAndReplaceFile.js')
    ).rejects.toThrow('exit')

    // test with file that doesnt exist
    await expect(() =>
      parseRegexPatterns('randomfilethatdoesntexist.js')
    ).rejects.toThrow('exit')
  })
  test('findAndReplace', async () => {
    // get the regex patterns in each file and store in dict
    const jsFileToRegex: Record<string, DefaultExport> = {}
    const matches = globSync('./' + fixtureFindAndReplaceFilesPath + '*.js')
    for (const match of matches) {
      const path = join(process.cwd(), match)
      const module = await import(path)
      const defaultExport = module.default
      jsFileToRegex[match] = DefaultExport.parse(defaultExport)
    }

    // we're gonna make the filesystem with a simple dictionary
    const fake_filesystem: Record<string, string> = {}
    // used to unmock readFileSync -- get the actual implementation
    vi.doUnmock(import('node:fs'))
    const { readFileSync: unmockedReadFile } = await import('node:fs')
    const replaceTargetFiles = globSync(fixtureReplaceTargetFiles + '*')
    const resetFakeFileSystem = () => {
      for (const file of replaceTargetFiles) {
        fake_filesystem[file] = unmockedReadFile(file, 'utf-8')
      }
    }
    // mock readFileSync by having it read from our fake fs
    vi.mocked(readFileSync).mockImplementation((filename) => {
      return fake_filesystem[filename.toString()]
    })
    // mock writeFileSync by having it write to our fake fs
    vi.mocked(writeFileSync).mockImplementation((filename, contents) => {
      fake_filesystem[filename.toString()] = contents.toString()
    })

    let nextCallIndex = 0
    for (const jsFile in jsFileToRegex) {
      resetFakeFileSystem()
      const fileModifications = findAndReplace(jsFileToRegex[jsFile])

      /* writeFileSync can be called multiple times b/c
      multiple regex patterns can write to the same file*/
      for (
        let i = nextCallIndex;
        i < vi.mocked(writeFileSync).mock.calls.length;
        i++
      ) {
        const calls = vi.mocked(writeFileSync).mock.calls
        const replaceTargetFile = calls[i][0].toString()

        // create snapshot in directory jsFile, with name replaceTargetFile
        const snapshotDir = `__snapshots__/${basename(jsFile, '.js')}`
        await expect(fake_filesystem[replaceTargetFile]).toMatchFileSnapshot(
          `${snapshotDir}/${basename(replaceTargetFile)}`
        )

        // create diff snapshot used to test return of fileModifications
        await expect(
          createPatch(
            replaceTargetFile,
            fileModifications[replaceTargetFile].oldContent,
            fileModifications[replaceTargetFile].newContent
          )
        ).toMatchFileSnapshot(
          `${snapshotDir}/${basename(replaceTargetFile)}.diff`
        )
        nextCallIndex++
      }
    }

    // test with file that doesnt exist
    expect(() =>
      findAndReplace([
        { find: 'hello', replace: 'bye', files: ['fileThatDoesntExit.txt'] }
      ])
    ).toThrow('exit')
  })

  test('printJobSummary', () => {
    const fileModifications: FileModifications = {
      'hi.txt': { oldContent: 'hi', newContent: 'bye' }
    }
    printJobSummary('some-find-and-replace-file.js', fileModifications)
    expect(vi.mocked(core).summary.stringify()).toMatchFileSnapshot(
      '__snapshots__/printJobSummary.md'
    )
  })
})
