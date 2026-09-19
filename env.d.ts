/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_CLUBNAME: string;
    readonly VITE_FIREBASE_APIKEY: string;
    readonly VITE_FIREBASE_APP_ID: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN: string;
    readonly VITE_FIREBASE_MESSAGE_SENDER_ID: string;
    readonly VITE_FIREBASE_PROJECT_ID: string;
    readonly VITE_FIREBASE_STORAGE_BUCKET: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare const __APP_VERSION__: string;

// Oxlint's type-aware check can't parse SFCs; vue-tsc still resolves the real
// per-component types, which take precedence over this fallback.
declare module '*.vue' {
    import type { DefineComponent } from 'vue';
    const component: DefineComponent;
    export default component;
}
