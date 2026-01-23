/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: [
    // Expo's recommended rules (includes React/React Native best practices)
    'expo',
  ],
  ignorePatterns: ['node_modules/', 'dist/', 'build/', '.expo/', '.expo-shared/'],
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      rules: {
        // Keep lint signal high; let TypeScript handle types.
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      },
    },
  ],
};
