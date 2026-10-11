import { MAX_KEY, MIN_KEY } from './constants';
import type { Curve } from './math/pchip';
import { createPchip } from './math/pchip';


export interface DeviationPoint {
    key: number;
    value: number;
}


/** PCHIP through the pin deviations, with zero anchors at both ends unless a pin sits there. */
export function buildDeviation(points: readonly DeviationPoint[]): Curve {
    const sorted: DeviationPoint[] = [...points].sort((a: DeviationPoint, b: DeviationPoint): number => a.key - b.key);

    if (!sorted.some((point: DeviationPoint): boolean => point.key === MIN_KEY)) {
        sorted.unshift({ key: MIN_KEY, value: 0 });
    }

    if (!sorted.some((point: DeviationPoint): boolean => point.key === MAX_KEY)) {
        sorted.push({ key: MAX_KEY, value: 0 });
    }

    return createPchip(
        sorted.map((point: DeviationPoint): number => point.key),
        sorted.map((point: DeviationPoint): number => point.value),
    );
}
