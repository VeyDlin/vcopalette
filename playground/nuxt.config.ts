import { fileURLToPath } from 'node:url';


export default defineNuxtConfig({
    modules: ['@nuxt/ui'],
    // injectCss writes a <style> tag through document — client-only.
    ssr: false,
    devtools: { enabled: false },
    css: ['~/assets/css/main.css'],
    alias: {
        vcopalette: fileURLToPath(new URL('../packages/vcopalette/src', import.meta.url)),
    },
    // @nuxt/fonts fetches remote provider metadata while compiling CSS and stalls without network.
    ui: {
        fonts: false,
    },
    vite: {
        optimizeDeps: {
            include: ['culori'],
        },
    },
    // The alias type-checks packages/vcopalette/src here; the package compiles with its own tsconfig, without this flag.
    typescript: {
        tsConfig: {
            compilerOptions: {
                noUncheckedIndexedAccess: false,
            },
        },
    },
    compatibilityDate: '2026-10-01',
});
