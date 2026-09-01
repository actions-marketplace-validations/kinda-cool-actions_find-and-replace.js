import { appendFileSync, globSync } from 'node:fs'
import { fixtureFindAndReplaceFilesPath } from '../../__fixtures__/utils.js'
import { string } from 'zod'
import { basename, join } from 'node:path'

if (process.env.GITHUB_OUTPUT == undefined)
  process.env.GITHUB_OUTPUT = '.github/workflow-utilities/fake_output.env'

const files = globSync(fixtureFindAndReplaceFilesPath + '*.js')
appendFileSync(
  process.env.GITHUB_OUTPUT,
  'files=' + JSON.stringify(files) + '\n'
)

const fileToTestOutput = {}

for (const file of files) {
  const fileImport = await import(join(process.cwd(), file))
  let defaultExport = fileImport.default
  if (!(defaultExport instanceof Array)) defaultExport = [defaultExport]
  let allModifiedFiles = []
  for (const pattern of defaultExport) {
    if (pattern.files instanceof string) pattern.files = [pattern.files]
    allModifiedFiles = allModifiedFiles.concat(pattern.files)
  }
  const uniqueFiles = Array.from(new Set(allModifiedFiles))
  const expectedFiles = []
  for (const uniqueFile of uniqueFiles) {
    expectedFiles.push(
      `__tests__/__snapshots__/${basename(file, '.js')}/${basename(uniqueFile)}`
    )
  }
  fileToTestOutput[file] = { expected: expectedFiles, actual: uniqueFiles }
}

appendFileSync(
  process.env.GITHUB_OUTPUT,
  'test-obj=' + JSON.stringify(fileToTestOutput) + '\n'
)
