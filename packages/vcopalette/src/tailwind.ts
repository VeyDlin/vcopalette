import type { Palette } from './types';


export function toTailwindTheme(palette: Palette): string {
    const cellLines: string[] = [];
    const aliasLines: string[] = [];

    for (const [colorName, tokens] of Object.entries(palette)) {
        for (const token of tokens) {
            cellLines.push(`    --color-${colorName}-${token.key}: ${token.hex};`);
        }

        for (const token of tokens) {
            if (token.name !== undefined) {
                aliasLines.push(`    --color-${token.name}: var(--color-${colorName}-${token.key});`);
            }
        }
    }

    let theme: string = `@theme {\n${cellLines.join('\n')}\n}\n`;

    if (aliasLines.length > 0) {
        theme += `\n@theme inline {\n${aliasLines.join('\n')}\n}\n`;
    }

    return theme;
}
