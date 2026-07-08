// Flat ESLint config (ESLint 9+/10). The previous `npm run lint` script pointed
// at `eslint` but no config existed, so lint never actually ran. This wires up
// typescript-eslint for the API and shared packages.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/drizzle/**',
      'apps/mobile/**', // RN/Expo app has its own toolchain; lint API + shared here
      '**/*.config.js',
      '**/*.config.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['packages/*/src/**/*.ts', 'apps/api/src/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { sourceType: 'module' },
    },
    rules: {
      // Pragmatic defaults for a beta codebase — surface real problems without
      // drowning the team in churn. Tighten over time.
      '@typescript-eslint/no-explicit-any': 'off',
      // Express augments the Request type via `declare global { namespace Express }`,
      // which is the idiomatic pattern for this — allow it.
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
  {
    // Test files may use looser patterns.
    files: ['apps/api/src/**/*.test.ts', 'apps/api/src/__tests__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
);
