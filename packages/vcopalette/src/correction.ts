import { LIGHTNESS_EPSILON } from './constants';
import { isotonicNonIncreasing } from './math/isotonic';


/**
 * Makes lightness strictly decreasing over the keys. Entries with fixed[i] = true are kept as they are;
 * free entries between fixed points are pulled into the gap their neighbors leave.
 */
export function correctLightness(values: readonly number[], fixed: readonly boolean[]): number[] {
    const n: number = values.length;
    const result: number[] = [...values];

    let upper: number = 1 + LIGHTNESS_EPSILON;
    let i: number = 0;

    while (i < n) {
        if (fixed[i]) {
            upper = values[i];
            i++;

            continue;
        }

        let end: number = i;

        while (end < n && !fixed[end]) {
            end++;
        }

        const lower: number = end < n ? values[end] : -LIGHTNESS_EPSILON;
        const count: number = end - i;
        const segment: number[] = isotonicNonIncreasing(values.slice(i, end), new Array<number>(count).fill(1));

        for (let j: number = 0; j < count; j++) {
            const low: number = lower + LIGHTNESS_EPSILON * (count - j);
            const high: number = upper - LIGHTNESS_EPSILON * (j + 1);
            let value: number = Math.min(high, Math.max(low, segment[j]));

            if (j >= 1) {
                value = Math.min(value, result[i + j - 1] - LIGHTNESS_EPSILON);
            }

            result[i + j] = value;
        }

        i = end;
    }

    return result;
}
