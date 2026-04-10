import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  { ignores: ['dist'] },
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: { console: 'readonly', process: 'readonly' },
      parserOptions: { projectService: false },
    },
  },
);
