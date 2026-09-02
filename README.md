# find-and-replace.js

![Coverage](./badges/coverage.svg) ![CI Status](https://www.github.com/kinda-cool-actions/find-and-replace.js/actions/workflows/ci.yml/badge.svg)![E2E Status](https://github.com/kinda-cool-actions/find-and-replace.js/actions/workflows/e2e.yml/badge.svg)

A GitHub Action that finds and replaces text using a JS file!

## Quickstart

Add the following JS file to your repo:

```js
// find-and-replace.js

export default {
  find: 'what you wanna find',
  replace: 'what you wanna replace it with',
  files: ['the file(s) that you wanna replace it in']
}
```

Add the following step to your workflow:

```yml
# release.yml

- name: Find and Replace With JS
  id: find-and-replace-id
  uses: kinda-cool-actions/find-and-replace.js@undefined
  with:
    file: find-and-replace.js # The relative path to the JS file.
```

It outputs `modified-files`, which is a string, JSON array of the modified files.

See below for [further details](#input-details) and a [full sample workflow](#full-sample-workflow).

## But why JS??

I know what you might be asking:

> Ok... I get that this action finds and replaces text... but why an extra JS file? Can't I just define my find-and-replace pattern in the workflow directly?

Here are my counter questions:

1. Why not define your find-and-replace patterns, especially your regex patterns, using syntax you already know? With JS, that's `/\d+/g` or `RegExp('\\d+', 'g')`.

2. Why not define multiple patterns at once using array syntax you're very familliar with?

3. Why not spice up your find-and-replace patterns with a bit of logic, like if statements?

4. Why not pass and use environment variables?

5. And finally, why not utilize the full-fledged force of a programming language like JS to define more complex patterns?

## Input Details

This action only has 1 input: `file`, which defaults to `find-and-replace.js`

The input `file` must:

1. Be a relative path to a JS file.

2. Contain a default export with the following properties:

```js
    export default {
        find: string | RegExp,   // the thing to find
        replace: string,         // the thing to replace
        files: string | Array<string>   // the file(s) to find and replace in
    }
```

You can also export an array of objects, like so:

```js

    export default [{  // use an array to define multiple patterns
        find: string | RegExp,
        replace: string,
        files: string | Array<string>
    }]
```

## Output Details

The action only outputs 1 variable: `modifified-files`.

This is a string, JSON array of the modified files.

Example: `'["hi.txt", "bye.txt"]'`, where `hi.txt` and `bye.txt` were both modified.

## Full Sample Workflow

For a real example of how this action works, check out **this** repo! Yes, this action repo uses itself in a `release` workflow.

For brevity, the JS and YML workflow files are copied down below:

```js
// find-and-replace.js

import { readFileSync } from 'node:fs'

let findAndReplaceFile = readFileSync('find-and-replace.js', 'utf-8')
// to avoid recursive regex substitutions, you can ignore this step
findAndReplaceFile = findAndReplaceFile.replace(/\$(\d)/g, '$\\$\1')

const releaseWorkflow = readFileSync('.github/workflows/release.yml', 'utf-8')

export default [
  {
    find: /kinda-cool-actions\/find-and-replace\.js@v\d+\.\d+\.\d+/g,

    replace: `kinda-cool-actions/find-and-replace.js@${process.env.RELEASE_VERSION}`,

    files: 'README.md'
  },
  {
    find: /(Sample Workflow.*```js.*?find-and-replace\.js\s+).*?(\s+```)/s,

    replace: `$\1${findAndReplaceFile}$\2`,

    files: ['README.md']
  },
  {
    find: /(Sample Workflow.*```yml.*?release\.yml\s+).*?(\s+```)/s,

    replace: `$\1${releaseWorkflow}$\2`,

    files: 'README.md'
  }
]

```

```yml
# release.yml

name: Update Docs on Release
on:
  release:
    types:
      - published

permissions:
  contents: read

jobs:
  edit-readme:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v7.0.1
        with:
          ref: main
      - name: Find and Replace JS
        uses: ./
        with:
          RELEASE_VERSION: ${{github.event.release.tag_name}}
      - run: |
          git config user.name ${{github.triggering_actor}}
          git config user.email ${{github.actor_id}}@github-actions.com
          git add .
          git commit -m "docs: update readme"
          git push

```
