import { clampChroma, converter, formatHex, parse } from 'culori';
import type { Color, Oklch as CulioriOklch } from 'culori';

import type { Oklch } from './types';


export interface ParsedColor {
    l: number;
    c: number;
    /** null when culori leaves the hue undefined (achromatic colors). */
    h: number | null;
}


const toOklch: (color: Color) => CulioriOklch | undefined = converter('oklch');

export function parseColor(color: string): ParsedColor | null {
    const parsed: Color | undefined = parse(color);

    if (parsed === undefined) {
        return null;
    }

    const oklch: CulioriOklch | undefined = toOklch(parsed);

    if (oklch === undefined) {
        return null;
    }

    return { l: oklch.l, c: oklch.c, h: oklch.h ?? null };
}

export function normalizeHex(color: string): string | null {
    const parsed: Color | undefined = parse(color);

    if (parsed === undefined) {
        return null;
    }

    const hex: string | undefined = formatHex(parsed);

    if (hex === undefined) {
        return null;
    }

    return hex.toLowerCase();
}

export function oklchToHex(l: number, c: number, h: number): string {
    const clamped: Color = clampChroma({ mode: 'oklch', l, c, h }, 'oklch');
    const hex: string | undefined = formatHex(clamped);

    if (hex === undefined) {
        throw new Error(`Internal: OKLCH (${l}, ${c}, ${h}) could not be formatted as hex`);
    }

    return hex.toLowerCase();
}

export function hexToOklch(hex: string): Oklch {
    const parsed: ParsedColor | null = parseColor(hex);

    if (parsed === null) {
        throw new Error(`Internal: hex ${hex} could not be converted to OKLCH`);
    }

    return { l: parsed.l, c: parsed.c, h: parsed.h ?? 0 };
}
