import { ACHROMATIC_CHROMA } from './constants';
import type { Curve } from './math/pchip';
import type { ResolvedPin } from './resolve';


interface HueKnot {
    key: number;
    hue: number;
}


/** Piecewise linear hue along the shortest arc, held at the ends, wrapped into [0, 360). */
export function buildHue(pins: readonly ResolvedPin[], fallback: number): Curve {
    const knots: HueKnot[] = [];

    for (const pin of pins) {
        if (pin.h !== null && pin.c >= ACHROMATIC_CHROMA) {
            knots.push({ key: pin.key, hue: pin.h });
        }
    }

    if (knots.length === 0) {
        return (): number => fallback;
    }

    knots.sort((a: HueKnot, b: HueKnot): number => a.key - b.key);

    const unwrapped: number[] = [knots[0].hue];

    for (let i: number = 1; i < knots.length; i++) {
        const previous: number = unwrapped[i - 1];
        let delta: number = knots[i].hue - previous;

        while (delta <= -180) {
            delta += 360;
        }

        while (delta > 180) {
            delta -= 360;
        }

        unwrapped.push(previous + delta);
    }

    const last: number = knots.length - 1;

    return (key: number): number => {
        let value: number;

        if (key <= knots[0].key) {
            value = unwrapped[0];
        } else if (key >= knots[last].key) {
            value = unwrapped[last];
        } else {
            let i: number = 0;

            while (knots[i + 1].key <= key) {
                i++;
            }

            const t: number = (key - knots[i].key) / (knots[i + 1].key - knots[i].key);

            value = unwrapped[i] + t * (unwrapped[i + 1] - unwrapped[i]);
        }

        return ((value % 360) + 360) % 360;
    };
}
