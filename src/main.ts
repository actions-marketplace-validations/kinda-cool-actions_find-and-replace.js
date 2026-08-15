import { readFileSync, writeFileSync } from 'node:fs'
import { exit } from 'node:process'
import * as z from 'zod'
import * as core from '@actions/core'

const RegexPattern = z.array(
  z.object({
    find: z.string().transform((s) => RegExp(s)),
    replace: z.string(),
    file: z.string(),
    flags: z
      .string()
      .regex(/^[dgimsuvy]*$/)
      .max(8)
      .default('')
  })
)

type RegexPattern = z.output<typeof RegexPattern>

/**
 * This file is the actual logic of the action
 * @returns {Promise<void>} Resolves when the action is complete
 */
export async function run(): Promise<void> {
  const input = core.getInput('patterns_file')
  core.debug(input)
  const parsed_regex = regexParser(input)
  fileRegexReplace(parsed_regex!)
}

function catchError(e: unknown, defaultMsg: string): never {
  if (e instanceof Error) {
    core.debug(e.message)
  } else {
    core.debug(defaultMsg)
  }
  exit(1)
}

function regexParser(regex_patterns: string): RegexPattern | undefined {
  let parsed_regex: RegexPattern
  try {
    const json_contents = readFileSync(regex_patterns, 'utf-8')
    parsed_regex = RegexPattern.parse(JSON.parse(json_contents))
  } catch (e) {
    catchError(
      e,
      'Failed to parse regex pattern. Please ensure your regex patterns are valid.'
    )
  }
  core.debug(`Parsed regex pattern:\n${parsed_regex.toString()}`)
  return parsed_regex
}

function fileRegexReplace(parsed_regex: RegexPattern) {
  for (const pattern of parsed_regex) {
    let file_contents
    try {
      file_contents = readFileSync(pattern.file, 'utf-8')
    } catch (e) {
      catchError(e, `${pattern.file} is not a valid file.`)
    }
    const full_regex = RegExp(pattern.find, pattern.flags)
    const new_file_contents = file_contents.replace(full_regex, pattern.replace)
    writeFileSync(pattern.file, new_file_contents, 'utf-8')
  }
}
// const jsonInput = [
//   {
//     find: /mermaid-maker\/action@v\d+\.\d+\.\d+/.source,
//     replace: 'mermaid-maker/action@v1.2.3',
//     file: 'example.md'
//   }
// ]
