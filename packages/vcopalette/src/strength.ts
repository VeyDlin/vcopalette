import type { Strength } from './types';


export function resolveStrength(strength: number | Strength | undefined): Strength {
    if (strength === undefined) {
        return { l: 1, c: 1 };
    }

    if (typeof strength === 'number') {
        return { l: strength, c: strength };
    }

    return { l: strength.l, c: strength.c };
}
