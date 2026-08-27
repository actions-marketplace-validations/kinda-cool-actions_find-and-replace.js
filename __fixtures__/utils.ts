import { InputDefaultExport } from '../src/main'

export const fixtureFindAndReplaceFilesPath =
  '__fixtures__/find_and_replace_files/'
export const fixtureReplaceTargetFiles = '__fixtures__/replace_target_files/'

export const objSimpleSingle: InputDefaultExport = {
  find: 'hi',
  replace: 'bye',
  files: fixtureReplaceTargetFiles + 'hi.txt'
}

export const objSimpleArray: InputDefaultExport[] = [
  {
    find: 'hi',
    replace: 'bye',
    files: [
      fixtureReplaceTargetFiles + 'hi.txt',
      fixtureReplaceTargetFiles + 'hi2.txt'
    ]
  },
  {
    find: 'foo',
    replace: 'bar',
    files: fixtureReplaceTargetFiles + 'foo.txt'
  }
]

export const objRegexSingle: InputDefaultExport = {
  find: /mermaid-maker\/action@v\d+\.\d+\.\d+/,
  replace: 'mermaid-maker/action@v1.2.3',
  files: fixtureReplaceTargetFiles + 'exampleREADME.md'
}

export const objRegexArray: InputDefaultExport[] = [
  {
    find: /mermaid-maker\/action@v\d+\.\d+\.\d+/,
    replace: 'mermaid-maker/action@v1.2.3',
    files: [
      fixtureReplaceTargetFiles + 'exampleREADME.md',
      fixtureReplaceTargetFiles + 'exampleProfile.md'
    ]
  },
  {
    find: /-?\d{1,3}°C/,
    replace: '-55°C',
    files: fixtureReplaceTargetFiles + 'exampleProfile.md'
  },
  {
    find: /(The weather.+It's ).+/,
    replace: '$1very cold and frigid.',
    files: fixtureReplaceTargetFiles + 'exampleProfile.md'
  }
]
