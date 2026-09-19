import ui from '@nuxt/ui/vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import vueDevTools from 'vite-plugin-vue-devtools';
import { defineConfig, lazyPlugins } from 'vite-plus';

// https://vite.dev/config/
export default defineConfig({
    staged: {
        '*': 'vp check --fix',
    },
    lint: {
        plugins: ['oxc', 'typescript', 'unicorn', 'vue'],
        categories: {
            correctness: 'warn',
        },
        env: {
            builtin: true,
        },
        ignorePatterns: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
        rules: {
            'vue/no-arrow-functions-in-watch': 'error',
            'vue/no-async-in-computed-properties': 'error',
            'vue/no-computed-properties-in-data': 'error',
            'vue/no-deprecated-data-object-declaration': 'error',
            'vue/no-deprecated-delete-set': 'error',
            'vue/no-deprecated-destroyed-lifecycle': 'error',
            'vue/no-deprecated-events-api': 'error',
            'vue/no-deprecated-model-definition': 'error',
            'vue/no-deprecated-props-default-this': 'error',
            'vue/no-deprecated-vue-config-keycodes': 'error',
            'vue/no-dupe-keys': 'error',
            'vue/no-export-in-script-setup': 'error',
            'vue/no-expose-after-await': 'error',
            'vue/no-lifecycle-after-await': 'error',
            'vue/no-reserved-component-names': 'error',
            'vue/no-reserved-keys': 'error',
            'vue/no-reserved-props': 'error',
            'vue/no-shared-component-data': 'error',
            'vue/no-side-effects-in-computed-properties': 'error',
            'vue/no-watch-after-await': 'error',
            'vue/prefer-import-from-vue': 'error',
            'vue/require-prop-type-constructor': 'error',
            'vue/require-render-return': 'error',
            'vue/require-slots-as-functions': 'error',
            'vue/return-in-computed-property': 'error',
            'vue/return-in-emits-validator': 'error',
            'vue/valid-define-emits': 'error',
            'vue/valid-define-options': 'error',
            'vue/valid-define-props': 'error',
            'vue/valid-next-tick': 'error',
            'no-array-constructor': 'error',
            'no-unused-expressions': 'error',
            'no-unused-vars': 'error',
            'typescript/ban-ts-comment': 'error',
            'typescript/no-duplicate-enum-values': 'error',
            'typescript/no-empty-object-type': 'error',
            'typescript/no-explicit-any': 'error',
            'typescript/no-extra-non-null-assertion': 'error',
            'typescript/no-misused-new': 'error',
            'typescript/no-namespace': 'error',
            'typescript/no-non-null-asserted-optional-chain': 'error',
            'typescript/no-require-imports': 'error',
            'typescript/no-this-alias': 'error',
            'typescript/no-unnecessary-type-constraint': 'error',
            'typescript/no-unsafe-declaration-merging': 'error',
            'typescript/no-unsafe-function-type': 'error',
            'typescript/no-wrapper-object-types': 'error',
            'typescript/prefer-as-const': 'error',
            'typescript/prefer-namespace-keyword': 'error',
            'typescript/triple-slash-reference': 'error',
            'vite-plus/prefer-vite-plus-imports': 'error',
        },
        overrides: [
            {
                files: [
                    '**/*.ts',
                    '**/*.tsx',
                    '**/*.mts',
                    '**/*.cts',
                    '**/*.vue',
                ],
                rules: {
                    'constructor-super': 'off',
                    'getter-return': 'off',
                    'no-class-assign': 'off',
                    'no-const-assign': 'off',
                    'no-dupe-class-members': 'off',
                    'no-dupe-keys': 'off',
                    'no-func-assign': 'off',
                    'no-import-assign': 'off',
                    'no-new-native-nonconstructor': 'off',
                    'no-obj-calls': 'off',
                    'no-redeclare': 'off',
                    'no-setter-return': 'off',
                    'no-this-before-super': 'off',
                    'no-undef': 'off',
                    'no-unreachable': 'off',
                    'no-unsafe-negation': 'off',
                    'no-var': 'error',
                    'no-with': 'off',
                    'prefer-const': 'error',
                    'prefer-rest-params': 'error',
                    'prefer-spread': 'error',
                },
            },
        ],
        options: {
            typeAware: true,
            typeCheck: true,
        },
        jsPlugins: [
            {
                name: 'vite-plus',
                specifier: 'vite-plus/oxlint-plugin',
            },
        ],
    },
    fmt: {
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
            groups: [
                ['builtin', 'external'],
                'component',
                'internal',
                'unknown',
            ],
        },
        ignorePatterns: ['.claude/**', 'public/**', '**/*.md'],
    },
    test: {
        // e2e/ holds Playwright specs, run by `vp run test`, not the Vitest built-in.
        include: ['src/**/*.{test,spec}.ts'],
        passWithNoTests: true,
    },
    plugins: lazyPlugins(() => [
        vue(),
        vueDevTools(),
        ui({
            autoImport: false,
            colorMode: false,
            icon: { clientBundle: { scan: true } },
            ui: {
                colors: {
                    primary: 'primary',
                    neutral: 'slate',
                },
                modal: {
                    variants: {
                        fullscreen: {
                            false: {
                                content: 'max-w-[calc(100vw-2rem)]',
                            },
                        },
                    },
                },
            },
        }),
    ]),
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
    build: {
        chunkSizeWarningLimit: 700,
        rolldownOptions: {
            output: {
                // The `$initial` tag limits each group to modules already on the
                // first-paint path, so lazily loaded vendor code keeps its own chunks.
                codeSplitting: {
                    groups: [
                        {
                            name: 'firebase',
                            test: /node_modules[\\/](@firebase|firebase|re2js|idb)[\\/]/,
                            tags: ['$initial'],
                        },
                        {
                            name: 'vue',
                            test: /node_modules[\\/](vue|vue-router|vue-i18n|@vue|@intlify|pinia|@vueuse)[\\/]/,
                            tags: ['$initial'],
                        },
                        {
                            name: 'ui',
                            test: /node_modules[\\/](reka-ui|@nuxt[\\/]ui|@internationalized|tailwind-variants|@tanstack)[\\/]/,
                            tags: ['$initial'],
                        },
                    ],
                },
            },
        },
    },
});
