import { defineConfig } from 'tsdown';


export default defineConfig({
    entry: [
        'src/index.ts',
        'src/css.ts',
        'src/tailwind.ts',
        'src/nuxt-ui.ts',
        'src/dtcg.ts',
    ],
    format: 'esm',
    dts: true,
    clean: true,
});
