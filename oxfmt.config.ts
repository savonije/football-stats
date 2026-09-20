import type { UserConfig } from 'vite';
import type {} from 'vite-plus';

export default {
    arrowParens: 'always',
    printWidth: 80,
    singleQuote: true,
    tabWidth: 4,
    trailingComma: 'all',
    vueIndentScriptAndStyle: true,
    sortPackageJson: false,
    sortTailwindcss: {},
    sortImports: {
        customGroups: [
            {
                groupName: 'component',
                elementNamePattern: ['@/**/*.vue'],
            },
        ],
        groups: [['builtin', 'external'], 'component', 'internal', 'unknown'],
    },
    ignorePatterns: ['.claude/**', 'public/**', '**/*.md'],
} satisfies NonNullable<UserConfig['fmt']>;
