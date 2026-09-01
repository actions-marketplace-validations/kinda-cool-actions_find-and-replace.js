import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'

if (process.env.TEST_OBJ == undefined)
  process.env.TEST_OBJ =
    '{"__fixtures__/find_and_replace_files/array_mixed_mixed.js":{"expected":["__tests__/__snapshots__/array_mixed_mixed/hi.txt","__tests__/__snapshots__/array_mixed_mixed/hi2.txt","__tests__/__snapshots__/array_mixed_mixed/foo.txt","__tests__/__snapshots__/array_mixed_mixed/exampleREADME.md","__tests__/__snapshots__/array_mixed_mixed/exampleProfile.md"],"actual":["__fixtures__/replace_target_files/hi.txt","__fixtures__/replace_target_files/hi2.txt","__fixtures__/replace_target_files/foo.txt","__fixtures__/replace_target_files/exampleREADME.md","__fixtures__/replace_target_files/exampleProfile.md"]},"__fixtures__/find_and_replace_files/obj_regex_array.js":{"expected":["__tests__/__snapshots__/obj_regex_array/exampleREADME.md","__tests__/__snapshots__/obj_regex_array/exampleProfile.md"],"actual":["__fixtures__/replace_target_files/exampleREADME.md","__fixtures__/replace_target_files/exampleProfile.md"]},"__fixtures__/find_and_replace_files/obj_regex_single.js":{"expected":["__tests__/__snapshots__/obj_regex_single/exampleREADME.md"],"actual":["__fixtures__/replace_target_files/exampleREADME.md"]},"__fixtures__/find_and_replace_files/obj_simple_array.js":{"expected":["__tests__/__snapshots__/obj_simple_array/hi.txt","__tests__/__snapshots__/obj_simple_array/hi2.txt","__tests__/__snapshots__/obj_simple_array/foo.txt"],"actual":["__fixtures__/replace_target_files/hi.txt","__fixtures__/replace_target_files/hi2.txt","__fixtures__/replace_target_files/foo.txt"]},"__fixtures__/find_and_replace_files/obj_simple_single.js":{"expected":["__tests__/__snapshots__/obj_simple_single/hi.txt"],"actual":["__fixtures__/replace_target_files/hi.txt"]}}'

if (process.env.FIND_AND_REPLACE_FILE == undefined)
  process.env.FIND_AND_REPLACE_FILE =
    '__fixtures__/find_and_replace_files/array_mixed_mixed.js'

const parsedTestObj = JSON.parse(process.env.TEST_OBJ)
const find_and_replace_file = process.env.FIND_AND_REPLACE_FILE

for (const fileIndex in parsedTestObj[find_and_replace_file].expected) {
  assert.equal(
    readFileSync(
      parsedTestObj[find_and_replace_file].expected[fileIndex],
      'utf-8'
    ),
    readFileSync(
      parsedTestObj[find_and_replace_file].actual[fileIndex],
      'utf-8'
    )
  )
}
