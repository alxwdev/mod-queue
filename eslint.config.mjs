import nextPlugin from '@next/eslint-plugin-next';
import prettierConfig from 'eslint-config-prettier';
import jestDom from 'eslint-plugin-jest-dom';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import testingLibrary from 'eslint-plugin-testing-library';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

const testFiles = ['**/*.test.{ts,tsx}'];

export default defineConfig(
  globalIgnores([
    '**/.next/',
    '**/coverage/',
    '**/playwright-report/',
    '**/test-results/',
    'apps/web/src/gql/',
    'packages/api/src/generated/',
  ]),
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        // codegen.ts is the only TypeScript file at the root, where no tsconfig exists.
        projectService: { allowDefaultProject: ['codegen.ts'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    // Config files and other plain JS are not part of any tsconfig project.
    files: ['**/*.{js,mjs,cjs,jsx}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  reactHooks.configs.flat.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    files: ['apps/web/**'],
    extends: [nextPlugin.configs.recommended, nextPlugin.configs['core-web-vitals']],
    settings: { next: { rootDir: 'apps/web/' } },
  },
  {
    files: testFiles,
    extends: [testingLibrary.configs['flat/react'], jestDom.configs['flat/recommended']],
  },
  {
    // Server-only code (Prisma, secrets) must not reach the client bundle.
    ignores: ['apps/web/src/server/**', 'apps/web/src/app/api/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@modqueue/api',
              message:
                'Import @modqueue/api only in apps/web/src/server/** and apps/web/src/app/api/**.',
            },
          ],
        },
      ],
    },
  },
  prettierConfig,
);
