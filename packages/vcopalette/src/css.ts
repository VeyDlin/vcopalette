import type { Palette, PaletteToken } from './types';


export interface CssOptions {
    selector?: string;
    prefix?: string;
}


export function toCss(palette: Palette, options: CssOptions = {}): string {
    const selector: string = options.selector ?? ':root';
    const prefix: string = options.prefix ?? 'color';
    const cellLines: string[] = [];
    const aliasLines: string[] = [];

    for (const [colorName, tokens] of Object.entries(palette)) {
        for (const token of tokens) {
            cellLines.push(`    --${prefix}-${colorName}-${token.key}: ${token.hex};`);
        }

        for (const token of tokens) {
            if (token.name !== undefined) {
                aliasLines.push(`    --${token.name}: var(--${prefix}-${colorName}-${token.key});`);
            }
        }
    }

    return `${selector} {\n${[...cellLines, ...aliasLines].join('\n')}\n}\n`;
}

export function injectCss(css: string, id: string = 'vcopalette'): void {
    const existing: HTMLElement | null = document.getElementById(id);

    if (existing instanceof HTMLStyleElement) {
        existing.textContent = css;

        return;
    }

    const style: HTMLStyleElement = document.createElement('style');

    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
}
