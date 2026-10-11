import { describe, expect, it } from 'vitest';

import { generate } from '../src/index';
import { toNuxtUi } from '../src/nuxt-ui';
import type { NuxtUiAliases, NuxtUiTheme } from '../src/nuxt-ui';
import type { Palette, PaletteConfig } from '../src/types';
import { referenceConfig } from './fixtures/reference';


describe('toNuxtUi', (): void => {
    it('emits the old-neutral block when a mapped color is named neutral', (): void => {
        const palette: Palette = generate(referenceConfig);
        const aliases: NuxtUiAliases = { primary: 'blue', error: 'red', neutral: 'neutral' };
        const theme: NuxtUiTheme = toNuxtUi(palette, aliases);

        expect(theme.css).toContain('--color-old-neutral-500: var(--color-neutral-500);');
        expect(theme.css).toContain('--accent: var(--color-blue-400);');
    });

    it('maps the aliases into appConfig', (): void => {
        const palette: Palette = generate(referenceConfig);
        const aliases: NuxtUiAliases = { primary: 'blue', error: 'red', neutral: 'neutral' };

        expect(toNuxtUi(palette, aliases).appConfig.ui.colors).toEqual(aliases);
    });

    it('emits no old-neutral block when no alias maps to neutral', (): void => {
        const palette: Palette = generate({ colors: { gray: { group: 'neutral' } } });
        const theme: NuxtUiTheme = toNuxtUi(palette, { neutral: 'gray' });

        expect(theme.css).not.toContain('--color-old-neutral');
        expect(theme.appConfig.ui.colors).toEqual({ neutral: 'gray' });
    });

    it('throws on an alias naming an unknown color', (): void => {
        const palette: Palette = generate(referenceConfig);

        expect((): NuxtUiTheme => toNuxtUi(palette, { primary: 'teal' })).toThrow(/teal/);
    });

    it('throws when the mapped color lacks the Nuxt UI shades', (): void => {
        const config: PaletteConfig = {
            keys: [400],
            colors: {
                blue: {
                    pins: [
                        { key: 400, color: '#58AEEE' },
                    ],
                },
            },
        };
        const palette: Palette = generate(config);

        expect((): NuxtUiTheme => toNuxtUi(palette, { primary: 'blue' })).toThrow(/50, 100, 200, 300, 500, 600, 700, 800, 900, 950/);
    });
});
