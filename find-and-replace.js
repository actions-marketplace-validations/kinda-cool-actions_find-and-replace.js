import { readFileSync } from 'node:fs'

const findAndReplaceFile = readFileSync('find-and-replace.js', 'utf-8')
const releaseWorkflow = readFileSync('.github/workflows/release.yml', 'utf-8')

export default [
  {
    find: /kinda-cool-actions\/find-and-replace\.js@v\d+\.\d+\.\d+/g,

    replace: `kinda-cool-actions/find-and-replace.js@${process.env.RELEASE_VERSION}`,

    files: 'README.md'
  },
  {
    find: /(Sample Workflow.*```js.*?find-and-replace\.js\s+).*?(\s+```)/s,

    replace: `$1${findAndReplaceFile}$2`,

    files: ['README.md']
  },
  {
    find: /(Sample Workflow.*```yml.*?release\.yml\s+).*?(\s+```)/s,

    replace: `$1${releaseWorkflow}$2`,

    files: 'README.md'
  }
]
