import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    base: '/',
    plugins: [vue(), vueJsx(), tailwindcss()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern',
            },
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vue-vendors': ['vue', 'vue-router'],
                    firebase: [
                        'firebase/app',
                        'firebase/auth',
                        'firebase/firestore',
                    ],
                },
            },
        },
        minify: 'esbuild',
    },
});
