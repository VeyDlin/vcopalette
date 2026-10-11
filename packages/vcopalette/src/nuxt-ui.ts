import { DEFAULT_KEYS } from './constants';
import { toCss } from './css';
import type { Palette, PaletteToken } from './types';


export type NuxtUiAlias = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral';

export type NuxtUiAliases = Partial<Record<NuxtUiAlias, string>>;

export interface NuxtUiTheme {
    css: string;
    appConfig: {
        ui: {
            colors: NuxtUiAliases;
        };
    };
}


const allAliases: readonly NuxtUiAlias[] = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'];


export function toNuxtUi(palette: Palette, aliases: NuxtUiAliases): NuxtUiTheme {
    const colors: NuxtUiAliases = {};
    const mappedColors: string[] = [];

    for (const alias of allAliases) {
        const colorName: string | undefined = aliases[alias];

        if (colorName === undefined) {
            continue;
        }

        assertShades(palette, alias, colorName);

        colors[alias] = colorName;
        mappedColors.push(colorName);
    }

    let css: string = toCss(palette);

    if (mappedColors.includes('neutral')) {
        const lines: string[] = DEFAULT_KEYS.map((shade: number): string => `    --color-old-neutral-${shade}: var(--color-neutral-${shade});`);

        css += `:root {\n${lines.join('\n')}\n}\n`;
    }

    return {
        css: css,
        appConfig: {
            ui: {
                colors: colors,
            },
        },
    };
}


function assertShades(palette: Palette, alias: NuxtUiAlias, colorName: string): void {
    if (!Object.hasOwn(palette, colorName)) {
        throw new Error(`vcopalette: alias "${alias}" maps to color "${colorName}", which is not in the palette`);
    }

    const tokens: PaletteToken[] = palette[colorName];
    const present: Set<number> = new Set<number>(tokens.map((token: PaletteToken): number => token.key));
    const missing: number[] = DEFAULT_KEYS.filter((shade: number): boolean => !present.has(shade));

    if (missing.length > 0) {
        throw new Error(`vcopalette: alias "${alias}" maps to color "${colorName}", which lacks the keys ${missing.join(', ')} that Nuxt UI reads`);
    }
}
