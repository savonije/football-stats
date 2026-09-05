import { fileURLToPath, URL } from 'node:url';
import eslint from '@nabla/vite-plugin-eslint';
import ui from '@nuxt/ui/vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { defineConfig } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        vueJsx(),
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
        eslint(),
    ],
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
