import { InputDefaultExport } from '../src/main'

export const fixtureFindAndReplaceFilesPath =
  '__fixtures__/find_and_replace_files/'
export const fixtureReplaceTargetFiles = '__fixtures__/replace_target_files/'

export const objSimpleSinglePattern: InputDefaultExport = {
  find: 'hi',
  replace: 'bye',
  files: fixtureReplaceTargetFiles + 'objSimpleSinglePattern.txt'
}

export const objRegexSinglePattern: InputDefaultExport = {
  find: /mermaid-maker\/action@v\d+\.\d+\.\d+/,
  replace: 'mermaid-maker/action@v1.2.3',
  files: fixtureReplaceTargetFiles + 'exampleREADME.md'
}
