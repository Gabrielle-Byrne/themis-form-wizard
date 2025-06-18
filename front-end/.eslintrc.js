module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    env: {
      browser: true,
      es6: true,
      node: true
    },
    extends: [
      'next/core-web-vitals',
      'plugin:@typescript-eslint/recommended',
    ],
    parserOptions: {
      ecmaFeatures: { jsx: true },
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    plugins: ['@typescript-eslint'],
    rules: {
      // Disable all the problematic rules
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'prefer-const': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'no-unused-vars': 'off',
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'off'
    },
    ignorePatterns: [
      'node_modules/*',
      '.next/*',
      'out/*',
      'public/*',
      '**/*.d.ts',
      '**/generated/*'
    ]
  };