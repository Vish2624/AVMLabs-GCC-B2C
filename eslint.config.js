import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    // src/ holds template and class-body fragments assembled by build.js, and the
    // runtime scripts are shipped as-is from Claude Design, so neither is linted.
    ignores: ['public/', 'node_modules/', 'src/', 'support.js', 'image-slot.js', 'icon.js', 'uploads/', 'screenshots/'],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    files: ['admin/**/*.js'],
    languageOptions: { globals: globals.browser },
  },
];
