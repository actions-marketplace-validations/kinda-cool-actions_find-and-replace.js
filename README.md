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
  uses: kinda-cool-actions/find-and-replace.js@v2.3.0
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

For brevity, the JS and workflow files are copied down below:

```js
// find-and-replace.js

name: find and replace text
on: push
permissions:
  contents: read # the whole workflow doesn't need write permissions

jobs:
  find-and-replace:
    runs-on: ubuntu-latest
    permissions:
      contents: write # only the job gets write permissions

    steps:
      - uses: actions/checkout@v7.0.2 # checkout repo

      - uses: kinda-cool-actions/find-and-replace.js
        id: find-and-replace-id
        with:
          file: find-and-replace.js # this is the default value

      - name: setup git
        run: |
          git config user.name ${{github.actor}}
          git config user.email ${{github.email}}

      # i add, commit and push manually, but you can use a 3rd party action

      # yes technically you can just use `git add .` instead of the following step
      # but this is making sure you only add files from the find-and-replace step
      - name: Stage modified files with python
        run: |
          import subprocess
          import os
          import json

          # load up modified files
          modified-files = json.loads(os.environ("MODIFIED-FILES"))

          for file in modified-files:
            subprocess.run(['git', 'add', file])
        env:
          MODIFIED-FILES: ${{steps.find-and-replace-id.outputs.modified-files}}

      - name: commit and push
        run: |
          git commit -m "fix: find and replace text"
          git push
```

```yml
# release.yml

name: release
```
