import { readFileSync, writeFileSync } from 'node:fs'
import { exit } from 'node:process'
import * as z from 'zod'
import * as core from '@actions/core'

const FindAndReplaceFile = z.string().endsWith('.js')
type FindAndReplaceFile = z.output<typeof FindAndReplaceFile>

const ExportedRegExp = z.object({
  find: z.union([z.instanceof(RegExp), z.string()]),
  replace: z.string(),
  files: z.union([z.array(z.string()), z.string().transform((obj) => [obj])])
})

const DefaultExport = z.union([
  ExportedRegExp.transform((obj) => [obj]),
  z.array(ExportedRegExp)
])
export type InputDefaultExport = z.input<typeof DefaultExport>
type DefaultExport = z.output<typeof DefaultExport>

function catchError(e: unknown, defaultMsg: string): never {
  if (e instanceof Error) {
    core.debug(e.message)
  } else {
    core.debug(defaultMsg)
  }
  exit(1)
}

export async function run(): Promise<void> {
  const inputFindAndReplaceFile = parseInputFindAndReplaceFile()
  const regexPatterns = await parseRegexPatterns(inputFindAndReplaceFile)
  findAndReplace(regexPatterns)
}

export function parseInputFindAndReplaceFile(): FindAndReplaceFile | never {
  const inputFindAndReplaceFile = core.getInput('find_and_replace_file')
  core.debug(inputFindAndReplaceFile)
  try {
    return FindAndReplaceFile.parse(inputFindAndReplaceFile)
  } catch (e) {
    catchError(e, 'Sorry, the input file cannot be recognized as a JS file.')
  }
}

export async function parseRegexPatterns(
  inputFindAndReplaceFile: FindAndReplaceFile
): Promise<DefaultExport> | never {
  let module: { default: DefaultExport }
  try {
    module = await import(`${process.cwd()}/${inputFindAndReplaceFile}`)
  } catch (e) {
    catchError(
      e,
      'Failed to parse regex pattern. Please ensure your regex patterns are valid.'
    )
  }
  let parsed_regex: DefaultExport
  try {
    parsed_regex = DefaultExport.parse(module.default)
  } catch (e) {
    catchError(
      e,
      `Sorry, the default export in ${inputFindAndReplaceFile}could not be found or recognized as an expected type.`
    )
  }

  for (const pattern of parsed_regex) {
    core.debug(pattern.find.toString())
  }
  return parsed_regex
}

export function findAndReplace(parsed_regex: DefaultExport) {
  for (const pattern of parsed_regex) {
    for (const file of pattern.files) {
      let file_contents
      try {
        file_contents = readFileSync(file, 'utf-8')
      } catch (e) {
        catchError(e, `${file} is not a valid file.`)
      }
      const new_file_contents = file_contents.replace(
        pattern.find,
        pattern.replace
      )
      writeFileSync(file, new_file_contents, 'utf-8')
    }
  }
}
