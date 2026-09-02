import { readFileSync } from 'node:fs'

// get this JS file
let findAndReplaceFile = readFileSync('find-and-replace.js', 'utf-8')
// to avoid recursive regex substitutions (like $1), you can ignore this step
findAndReplaceFile = findAndReplaceFile.replace(/\$(\d)/g, '$\\$1')

// get the release.yml file
const releaseWorkflow = readFileSync('.github/workflows/release.yml', 'utf-8')

export default [
  {
    // find references to the action
    find: /kinda-cool-actions\/find-and-replace\.js@v\d+\.\d+\.\d+.*/g,

    // replace with the new release sha and tag name using env
    replace: `kinda-cool-actions/find-and-replace.js@${process.env.RELEASE_SHA}  # v${process.env.RELEASE_TAG}`,

    // only do so for this file
    files: 'README.md'
  },
  {
    // find the sample workflow section, then the js code snippet and match its contents
    find: /(Sample Workflow.*```js.*?find-and-replace\.js\s+).*?(\s+```)/s,

    // replace the js code snippet's contents (the one you're currently reading)
    replace: `$1${findAndReplaceFile}$2`,

    // use array syntax this time
    files: ['README.md']
  },
  {
    // find the sample workflow section, then the yml code snippet and match contents
    find: /(Sample Workflow.*```yml.*?release\.yml\s+).*?(\s+```)/s,

    // replace yml code snippet contents
    replace: `$1${releaseWorkflow}$2`,

    // use just a simple string
    files: 'README.md'
  }
]
