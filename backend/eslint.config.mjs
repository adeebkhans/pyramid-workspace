// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'eslint.config.mjs'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: { sourceType: 'module', ecmaVersion: 2022 },
    },
    rules: {
      // Decorator metadata legitimately needs empty interfaces and `any` at the
      // Mongoose boundary; everywhere else these stay warnings so they surface
      // in review without failing the build.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Deliberately off. Nest resolves constructor dependencies from the
      // `design:paramtypes` metadata TypeScript emits, and that metadata is
      // erased for anything imported with `import type` — so "fixing" a
      // provider's import would break dependency injection at runtime.
      '@typescript-eslint/consistent-type-imports': 'off',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
);
