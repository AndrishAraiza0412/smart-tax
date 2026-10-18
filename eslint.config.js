import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/ios/**', '**/.expo/**', '**/*.config.js', '**/scripts/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // código existente: estilo como warning, errores reales siguen bloqueando
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      'no-empty': 'warn',
    },
  },
);
