import { DEFAULT_KEYS } from './constants';
import type { Palette, PaletteToken } from './types';


export interface DtcgColorValue {
    colorSpace: 'srgb';
    components: [number, number, number];
    hex: string;
}

export interface DtcgColorToken {
    $type: 'color';
    $value: DtcgColorValue | string;
}

export type DtcgTokens = Record<string, Record<string, DtcgColorToken> | DtcgColorToken>;


export function toDtcg(palette: Palette): DtcgTokens {
    const tokens: DtcgTokens = {};

    for (const [colorName, scale] of Object.entries(palette)) {
        const group: Record<string, DtcgColorToken> = {};

        for (const token of scale) {
            group[String(token.key)] = {
                $type: 'color',
                $value: {
                    colorSpace: 'srgb',
                    components: hexToComponents(token.hex),
                    hex: token.hex,
                },
            };
        }

        tokens[colorName] = group;
    }

    for (const [colorName, scale] of Object.entries(palette)) {
        for (const token of scale) {
            if (token.name !== undefined) {
                tokens[token.name] = {
                    $type: 'color',
                    $value: `{${colorName}.${token.key}}`,
                };
            }
        }
    }

    return tokens;
}


function hexToComponents(hex: string): [number, number, number] {
    return [
        channel(hex, 1),
        channel(hex, 3),
        channel(hex, 5),
    ];
}

function channel(hex: string, offset: number): number {
    const value: number = parseInt(hex.substring(offset, offset + 2), 16);

    return Math.round((value / 255) * 10000) / 10000;
}
