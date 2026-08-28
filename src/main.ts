import { readFileSync, writeFileSync } from 'node:fs'
import { exit } from 'node:process'
import * as z from 'zod'
import * as core from '@actions/core'
import { createPatch } from 'diff'

const FindAndReplaceFile = z.string().endsWith('.js')
type FindAndReplaceFile = z.output<typeof FindAndReplaceFile>

const ExportedRegExp = z.object({
  find: z.union([z.instanceof(RegExp), z.string()]),
  replace: z.string(),
  files: z.union([z.array(z.string()), z.string().transform((obj) => [obj])])
})

export const DefaultExport = z.union([
  ExportedRegExp.transform((obj) => [obj]),
  z.array(ExportedRegExp)
])
export type InputDefaultExport = z.input<typeof DefaultExport>
export type DefaultExport = z.output<typeof DefaultExport>

type FileModifications = Record<
  string,
  { oldContent: string; newContent: string }
>
const fileModifications: FileModifications = {}

function catchError(e: unknown, defaultMsg: string): never {
  if (e instanceof Error) {
    core.setFailed(e.message + `\n\nHint:${defaultMsg}`)
  } else {
    core.setFailed(defaultMsg)
  }
  exit(1)
}

export async function run(): Promise<void> {
  const inputFindAndReplaceFile = parseInputFindAndReplaceFile()
  const regexPatterns = await parseRegexPatterns(inputFindAndReplaceFile)
  findAndReplace(regexPatterns)
  printJobSummary(inputFindAndReplaceFile)
  setOutput()
}

export function parseInputFindAndReplaceFile(): FindAndReplaceFile | never {
  const inputFindAndReplaceFile = core.getInput('find_and_replace_file')
  try {
    return FindAndReplaceFile.parse(inputFindAndReplaceFile)
  } catch (e) {
    catchError(e, 'The input file cannot be recognized as a JS file.')
  }
}

export async function parseRegexPatterns(
  inputFindAndReplaceFile: FindAndReplaceFile
): Promise<DefaultExport> | never {
  let module
  try {
    module = (await import(`${process.cwd()}/${inputFindAndReplaceFile}`)) as {
      default: InputDefaultExport
    }
  } catch (e) {
    catchError(
      e,
      'Failed to import the find-and-replace file. Please make sure it exists.'
    )
  }
  let parsed_regex: DefaultExport
  try {
    parsed_regex = DefaultExport.parse(module.default)
  } catch (e) {
    catchError(
      e,
      `Sorry, the default export in ${inputFindAndReplaceFile} could not be found or recognized as an expected type.`
    )
  }

  return parsed_regex
}

export function findAndReplace(parsed_regex: DefaultExport) {
  for (const pattern of parsed_regex) {
    for (const file of pattern.files) {
      let file_contents
      try {
        file_contents = readFileSync(file, 'utf-8')
        if (file_contents === undefined) throw Error('File cannot be read.')
      } catch (e) {
        catchError(
          e,
          `${file} cannot be read. Please make sure the file exists, and you have the necessary permissions to read it.`
        )
      }
      const new_file_contents = file_contents.replace(
        pattern.find,
        pattern.replace
      )
      try {
        writeFileSync(file, new_file_contents, 'utf-8')
      } catch (e) {
        catchError(
          e,
          `${file} could not be written to. Please make sure the file exists, and you have the necessary permissions to write to it.`
        )
      }
      if (file in fileModifications) {
        fileModifications[file] = {
          oldContent: fileModifications[file].oldContent,
          newContent: new_file_contents
        }
      } else {
        fileModifications[file] = {
          oldContent: file_contents,
          newContent: new_file_contents
        }
      }
    }
  }
}

function printJobSummary(inputFindAndReplaceFile: string) {
  core.summary.addHeading('js-find-and-replace Action Summary')
  core.summary.addRaw(
    `**find-and-replace-file:** ${inputFindAndReplaceFile}`,
    true
  )
  core.summary.addRaw('The following are the changes made to each file:', true)
  for (const file in fileModifications) {
    core.summary.addDetails(
      file,
      core.summary
        .addCodeBlock(
          createPatch(
            file,
            fileModifications[file].oldContent,
            fileModifications[file].newContent
          ),
          'diff'
        )
        .stringify()
    )
  }
}

function setOutput() {
  core.setOutput('modified-files', Object.keys(fileModifications).join(' '))
  core.setOutput(
    'modified-files-json',
    JSON.stringify(Object.keys(fileModifications))
  )
}
