import { converter, formatHex, parse } from 'culori';


const toOklch = converter('oklch');


export interface OklchParts {
    l: number;
    c: number;
    h: number;
}


export function readOklch(color: string): OklchParts | null {
    const value = toOklch(color);
    if (value === undefined) {
        return null;
    }
    return { l: value.l, c: value.c, h: value.h ?? 0 };
}


export function formatOklch(parts: OklchParts): string {
    return `L ${parts.l.toFixed(3)} · C ${parts.c.toFixed(3)} · H ${Math.round(parts.h)}°`;
}


/** Any CSS colour culori understands → `#RRGGBB`, or null when unparseable. */
export function normalizeHex(color: string): string | null {
    const parsed = parse(color.trim());
    if (parsed === undefined) {
        return null;
    }
    return formatHex(parsed).toUpperCase();
}
