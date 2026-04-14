module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          // shared/ → domains/ 역방향 금지
          {
            target: './packages/frontend/src/shared/**/*',
            from: './packages/frontend/src/domains/**/*',
            message: 'shared/는 domains/를 import할 수 없습니다',
          },
          // shared/ → routes/ 역방향 금지
          {
            target: './packages/frontend/src/shared/**/*',
            from: './packages/frontend/src/routes/**/*',
            message: 'shared/는 routes/를 import할 수 없습니다',
          },
          // domains/ → routes/ 역방향 금지
          {
            target: './packages/frontend/src/domains/**/*',
            from: './packages/frontend/src/routes/**/*',
            message: 'domains/는 routes/를 import할 수 없습니다',
          },
        ],
      },
    ],
  },
  settings: {
    'import/resolver': {
      typescript: true,
      node: true,
    },
  },
  ignorePatterns: ['node_modules/', 'dist/', '*.js', '*.cjs'],
};
