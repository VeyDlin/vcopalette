import { normalizeHex, parseColor } from './color';
import type { ParsedColor } from './color';
import { resolveStrength } from './strength';
import type { ColorGroup, PaletteConfig, Strength } from './types';


export interface ResolvedPin {
    colorName: string;
    group: ColorGroup;
    key: number;
    hex: string;
    l: number;
    c: number;
    h: number | null;
    strength: Strength;
    name?: string;
}


/** Only call on a config that passed validate(). */
export function resolvePins(config: PaletteConfig): ResolvedPin[] {
    const result: ResolvedPin[] = [];

    for (const [colorName, colorConfig] of Object.entries(config.colors)) {
        const group: ColorGroup = colorConfig.group ?? 'chromatic';

        for (const pin of colorConfig.pins ?? []) {
            const parsed: ParsedColor | null = parseColor(pin.color);
            const hex: string | null = normalizeHex(pin.color);

            if (parsed === null || hex === null) {
                throw new Error(`Internal: pin color ${pin.color} of ${colorName} was not validated`);
            }

            const resolved: ResolvedPin = {
                colorName: colorName,
                group: group,
                key: pin.key,
                hex: hex,
                l: parsed.l,
                c: parsed.c,
                h: parsed.h,
                strength: resolveStrength(pin.strength),
            };

            if (pin.name !== undefined) {
                resolved.name = pin.name;
            }

            result.push(resolved);
        }
    }

    return result;
}
