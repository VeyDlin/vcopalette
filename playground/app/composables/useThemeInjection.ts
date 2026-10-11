import type { Palette } from 'vcopalette';
import type { NuxtUiAliases, NuxtUiTheme } from 'vcopalette/nuxt-ui';
import type { Ref } from 'vue';
import { injectCss } from 'vcopalette/css';
import { toNuxtUi } from 'vcopalette/nuxt-ui';
import { ref, watch } from 'vue';
import { usePlayground } from '~/composables/usePlayground';


export function useThemeInjection(): { themeError: Ref<string | null> } {
    const { palette, aliases } = usePlayground();
    const appConfig = useAppConfig();
    const themeError: Ref<string | null> = ref<string | null>(null);

    watch([palette, aliases], ([nextPalette, nextAliases]: [Palette, NuxtUiAliases]): void => {
        let theme: NuxtUiTheme;

        try {
            theme = toNuxtUi(nextPalette, nextAliases);
        } catch (error: unknown) {
            themeError.value = error instanceof Error ? error.message : String(error);

            return;
        }

        injectCss(theme.css, 'vcopalette');
        Object.assign(appConfig.ui.colors, theme.appConfig.ui.colors);
        themeError.value = null;
    }, { immediate: true });

    return { themeError: themeError };
}
