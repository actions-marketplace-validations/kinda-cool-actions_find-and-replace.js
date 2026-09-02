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
  uses: kinda-cool-actions/find-and-replace.js@7b90dc8047e8d5dd4022ed845b6b0d28cb2dfa80 # v2.5.1
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

## Regex Debugging

If you wanted to text out your regex patterns, [regex101.com](https://regex101.com/substitution?regex=%28kinda-cool-actions%5C%2Ffind-and-replace%5C.js%40%29v%5B%5Cd.%5D%2B.*&testString=kinda-cool-actions%2Ffind-and-replace.js%40v2.5.0++%23+name+of+the+action&flags=&flavor=javascript&delimiter=%2F&substitution=%241v1.2.3+%23+this+is+the+new+version) is a great resource. Check it out!!

## Full Sample Workflow

For a real example of how this action works, check out **this** repo! Yes, this action repo uses itself in a `release` workflow.

For brevity, the JS and YML workflow files are copied down below:

<pre lang='js'><code>
// find-and-replace.js

import { readFileSync } from 'node:fs'

// get this JS file
let findAndReplaceFile = readFileSync('find-and-replace.js', 'utf-8')
// to avoid recursive regex substitutions (like $\1), you can ignore this step
findAndReplaceFile = findAndReplaceFile.replace(/\$(\d)/g, '$\\$\1')

// get the release.yml file
const releaseWorkflow = readFileSync('.github/workflows/release.yml', 'utf-8')

export default [
  {
    // find references to the action
    find: /(kinda-cool-actions\/find-and-replace\.js@)v[\d.]+.*/g,

    // replace with the new release sha and tag name using env
    // $\1 in regex refers to the first capture group
    replace: `$\1${process.env.RELEASE_SHA}  # ${process.env.RELEASE_TAG}`,

    // only do so for this file
    files: 'README.md'
  },
  {
    // find the sample workflow section, then the js code snippet and match its contents
    find: /(Sample Workflow.*find-and-replace\.js\s+).*?(\s+<\/code>.*?<\/pre>)/s,

    // replace the js code snippet's contents (the one you're currently reading)
    replace: `$\1${findAndReplaceFile}$\2`,

    // use array syntax this time
    files: ['README.md']
  },
  {
    // find the sample workflow section, then the yml code snippet and match contents
    find: /(Sample Workflow.*release\.yml\s+).*?(\s+<\/code>.*<\/pre>)/s,

    // replace yml code snippet contents
    replace: `$\1${releaseWorkflow}$\2`,

    // use just a simple string
    files: 'README.md'
  }
]

</code></pre>

<pre lang='yml'><code>
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
        env:
          RELEASE_SHA: ${{github.sha}}
          RELEASE_TAG: ${{github.event.release.tag_name}}
      - run: |
          git config user.name ${{github.triggering_actor}}
          git config user.email ${{github.actor_id}}@github-actions.com
          git add .
          git commit -m "docs: update readme"
          git push

</code></pre>
