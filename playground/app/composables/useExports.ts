import type { Palette } from 'vcopalette';
import type { NuxtUiAliases, NuxtUiTheme } from 'vcopalette/nuxt-ui';
import type { ComputedRef } from 'vue';
import { toCss } from 'vcopalette/css';
import { toDtcg } from 'vcopalette/dtcg';
import { toNuxtUi } from 'vcopalette/nuxt-ui';
import { toTailwindTheme } from 'vcopalette/tailwind';
import { computed } from 'vue';
import { usePlayground } from '~/composables/usePlayground';


export type ExportKind = 'palette' | 'css' | 'tailwind' | 'nuxt-ui' | 'dtcg';


function nuxtUiOutput(palette: Palette, aliases: NuxtUiAliases): string {
    try {
        const theme: NuxtUiTheme = toNuxtUi(palette, aliases);

        return `${theme.css}\n// app.config.ts\nexport default defineAppConfig(${JSON.stringify(theme.appConfig, null, 4)});\n`;
    } catch (error: unknown) {
        return `// ${error instanceof Error ? error.message : String(error)}`;
    }
}


export function useExports(): { outputs: ComputedRef<Record<ExportKind, string>> } {
    const { palette, aliases } = usePlayground();

    const outputs: ComputedRef<Record<ExportKind, string>> = computed<Record<ExportKind, string>>((): Record<ExportKind, string> => {
        return {
            palette: JSON.stringify(palette.value, null, 4),
            css: toCss(palette.value),
            tailwind: toTailwindTheme(palette.value),
            'nuxt-ui': nuxtUiOutput(palette.value, aliases.value),
            dtcg: JSON.stringify(toDtcg(palette.value), null, 4),
        };
    });

    return { outputs: outputs };
}
