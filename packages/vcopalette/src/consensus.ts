import { DEFAULT_PEAK_CHROMA, MAX_KEY, MIN_KEY } from './constants';
import { isotonicNonIncreasing } from './math/isotonic';
import type { Curve } from './math/pchip';
import { createPchip } from './math/pchip';
import type { ResolvedPin } from './resolve';
import type { ColorGroup } from './types';


interface KeyedValue {
    key: number;
    value: number;
}

interface Knot {
    key: number;
    value: number;
    weight: number;
}


export function buildLightnessConsensus(pins: readonly ResolvedPin[]): Curve {
    const points: KeyedValue[] = pins.map((pin: ResolvedPin): KeyedValue => ({ key: pin.key, value: pin.l }));
    const knots: Knot[] = withAnchors(averageByKey(points), 1, 0);
    const values: number[] = isotonicNonIncreasing(
        knots.map((knot: Knot): number => knot.value),
        knots.map((knot: Knot): number => knot.weight),
    );

    return createPchip(knots.map((knot: Knot): number => knot.key), values);
}

export function buildChromaConsensus(pins: readonly ResolvedPin[], group: ColorGroup): Curve {
    const groupPins: ResolvedPin[] = pins.filter((pin: ResolvedPin): boolean => pin.group === group);

    if (groupPins.length === 0) {
        if (group === 'neutral') {
            return (): number => 0;
        }

        return (key: number): number => DEFAULT_PEAK_CHROMA * (1 - (2 * key / MAX_KEY - 1) ** 2);
    }

    const points: KeyedValue[] = groupPins.map((pin: ResolvedPin): KeyedValue => ({ key: pin.key, value: pin.c }));
    const knots: Knot[] = withAnchors(averageByKey(points), 0, 0);
    const curve: Curve = createPchip(
        knots.map((knot: Knot): number => knot.key),
        knots.map((knot: Knot): number => knot.value),
    );

    return (key: number): number => Math.max(0, curve(key));
}


/** Mean value per key, weighted by the number of points on that key, sorted by key. */
function averageByKey(points: readonly KeyedValue[]): Knot[] {
    const sums: Map<number, { total: number; count: number }> = new Map<number, { total: number; count: number }>();

    for (const point of points) {
        const entry: { total: number; count: number } = sums.get(point.key) ?? { total: 0, count: 0 };

        entry.total += point.value;
        entry.count++;
        sums.set(point.key, entry);
    }

    return [...sums.entries()]
        .map(([key, entry]: [number, { total: number; count: number }]): Knot => ({
            key: key,
            value: entry.total / entry.count,
            weight: entry.count,
        }))
        .sort((a: Knot, b: Knot): number => a.key - b.key);
}

/** Adds end knots at MIN_KEY and MAX_KEY unless a knot already sits there. */
function withAnchors(knots: readonly Knot[], lowValue: number, highValue: number): Knot[] {
    const result: Knot[] = [...knots];

    if (!knots.some((knot: Knot): boolean => knot.key === MIN_KEY)) {
        result.unshift({ key: MIN_KEY, value: lowValue, weight: 1 });
    }

    if (!knots.some((knot: Knot): boolean => knot.key === MAX_KEY)) {
        result.push({ key: MAX_KEY, value: highValue, weight: 1 });
    }

    return result;
}
