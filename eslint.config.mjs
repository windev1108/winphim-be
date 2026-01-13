module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    sourceType: 'module',
    ecmaVersion: 'latest',
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'prettier',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
  ],
  settings: {
    'import/resolver': {
      typescript: { alwaysTryTypes: true },
    },
  },

  rules: {
    // ----------- CORE RULES ----------
    'prettier/prettier': 'error',

    // No unused
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

    // No implicit any
    '@typescript-eslint/no-explicit-any': 'warn',

    // Strict async usage
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-floating-promises': 'error',

    // ----------- IMPORT ORDER ----------
    'import/order': [
      'error',
      {
        'newlines-between': 'always',
        alphabetize: { order: 'asc' },
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling', 'index'],
        ],
      },
    ],

    // ----------- TYPESCRIPT RULES ----------
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',

    // Allow empty functions for NestJS decorators (controllers/services)
    '@typescript-eslint/no-empty-function': [
      'error',
      { allow: ['constructors'] },
    ],
  },
};
