import type { Strength } from 'vcopalette';


/** A pin's strength in its expanded form; a missing strength is a nail. */
export function readStrength(strength: number | Strength | undefined): Strength {
    if (strength === undefined) {
        return { l: 1, c: 1 };
    }

    if (typeof strength === 'number') {
        return { l: strength, c: strength };
    }

    return strength;
}
