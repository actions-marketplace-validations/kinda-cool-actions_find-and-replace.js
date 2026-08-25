// See: https://eslint.org/docs/latest/use/configure/configuration-files

import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintConfigPretter from 'eslint-config-prettier'
import globals from 'globals'
import { defineConfig, globalIgnores } from 'eslint/config'
/* eslint-plugin-import-x is used instead of eslint-plugin-import 
b/c it looks more maintained*/
import { importX } from 'eslint-plugin-import-x'
import vitest from '@vitest/eslint-plugin'

export default defineConfig([
  /* By default, eslint matches all js/mjs/cjs files unless they're explicitly 
    ignored using globalIgnores. globalIgnores can match directories*/
  globalIgnores(['coverage', 'dist', 'linter']),
  {
    extends: [
      // eslint recommended js config to lint js files
      js.configs.recommended,

      // tseslint (typescript eslint) recommended to lint ts files
      /* tseslint also exports a named export called config that can be used
        to access the recommended config. i dont use it b/c the quickstart
        docs dont use it. the importx plugin will complain about it since
        it guesses its a mistake, so i disable eslinting for that rule*/
      // eslint-disable-next-line import-x/no-named-as-default-member
      tseslint.configs.recommended,

      // used to lint import errors in js files
      importX.flatConfigs.recommended,
      // used to lint import errors in ts files
      importX.flatConfigs.typescript,
      // used to lint errors in vitest files
      vitest.configs.recommended,
      // used to lint formatting errors with prettier
      eslintConfigPretter
    ],
    languageOptions: {
      // node is a global object
      globals: globals.node
    },
    // some more custom rules
    rules: {
      // allows console logs
      'no-console': 'off'
    }
  }
])
