module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:jest/recommended',
    'plugin:promise/recommended',
    'plugin:unicorn/recommended',
    'plugin:array-func/recommended',
    'prettier',
    'airbnb-base',
  ],
  plugins: [
    'node',
    'array-func',
    'jest',
    'optimize-regex',
    'prettier',
    'promise',
    'sql',
    'security',
    'unicorn',
    'jest',
    'jsdoc',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    impliedStrict: true,
  },
  env: {
    browser: false,
    node: true,
    jest: true,
    es6: true,
    worker: false,
    serviceworker: false,
    jquery: true,
  },
  ignorePatterns: ['public/static/*.min.*'],
  rules: {
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error',
    'max-len': ['error', { code: 100 }],
    'object-curly-newline': ['error', { consistent: true }],
    'array-func/prefer-array-from': 'off',
    'function-paren-newline': 'off',
    'no-underscore-dangle': 'off',
    'no-restricted-syntax': 'off',
    'no-await-in-loop': 'off',
    'unicorn/prefer-switch': 'off',
    'unicorn/no-array-push-push': 'off',
    'unicorn/no-array-for-each': 'off',
    'jest/no-conditional-expect': 'off',
    'optimize-regex/optimize-regex': 'warn',
    radix: ['error', 'as-needed'],
    'arrow-parens': ['error', 'always'],
    'func-names': ['error', 'never'],
    'no-unused-expressions': ['error', { allowTernary: true }],
    'operator-linebreak': 'off',
    'implicit-arrow-linebreak': 'off',
    'security/detect-possible-timing-attacks': 'off',
    'unicorn/explicit-length-check': 'off',
    'unicorn/prefer-array-some': 'off',
    'no-mixed-operators': [
      'error',
      {
        groups: [
          ['&', '|', '^', '~', '<<', '>>', '>>>'],
          ['==', '!=', '===', '!==', '>', '>=', '<', '<='],
          ['&&', '||'],
          ['in', 'instanceof'],
        ],
      },
    ],
    'sql/format': [
      'error',
      {
        ignoreExpressions: false,
        ignoreInline: true,
        ignoreTagless: true,
      },
    ],
    'sql/no-unsafe-query': [
      'error',
      {
        allowLiteral: false,
      },
    ],
    'node/no-unpublished-require': [
      'error',
      {
        allowModules: ['mongo-mock', 'mockdate'],
      },
    ],
    'jsdoc/check-param-names': 'error',
    'jsdoc/check-tag-names': 0,
    'jsdoc/check-types': 'error',
    'jsdoc/newline-after-description': 'error',
    'jsdoc/no-undefined-types': 1,
    'jsdoc/require-description-complete-sentence': 0,
    'jsdoc/require-example': 0,
    'jsdoc/require-hyphen-before-param-description': 'error',
    'jsdoc/require-param': 1,
    'jsdoc/require-param-description': 0,
    'jsdoc/require-param-name': 'error',
    'jsdoc/require-param-type': 'error',
    'jsdoc/require-returns-description': 0,
    'jsdoc/require-returns-type': 'error',
    'jsdoc/valid-types': 'error',
    'unicorn/prevent-abbreviations': [
      'error',
      {
        replacements: {
          i: {
            index: false,
          },
          j: {
            index: false,
          },
          fn: {
            function_: false,
          },
          fnReturn: {
            functionReturn: false,
          },
          forEachAsyncFunc: {
            forEachAsyncFunction: false,
          },
          lib: {
            library: false,
          },
          env: {
            environment: false,
          },
          db: {
            database: false,
          },
          err: {
            error: false,
          },
          num: {
            number: false,
          },
          src: {
            source: false,
          },
          el: {
            element: false,
          },
          req: {
            request: false,
          },
          res: {
            response: false,
            result: false,
          },
          args: {
            arguments: false,
          },
          prop: {
            property: false,
          },
          arr: {
            array: false,
          },
          conf: {
            config: false,
          },
          str: {
            string: false,
          },
          opts: {
            options: false,
          },
          doc: {
            document: false,
          },
          msg: {
            message: false,
          },
          cb: {
            callback: false,
          },
          e: {
            error: false,
            event: false,
          },
          ctx: {
            context: false,
          },
          rel: {
            relationship: false,
            related: false,
            relative: false,
          },
          props: {
            properties: false,
          },
          patientObject: {
            patientObject: false,
          },
          val: {
            value: false,
          },
          meanDev: {
            meanDevelopment: false,
          },
          meanDevAge: {
            meanDevelopmentAge: false,
          },
          lengthDev: {
            lengthDevelopment: false,
          },
          devWarning: {
            developmentWarning: false,
          },
          params: {
            parameters: false,
          },
        },
      },
    ],
  },
};
