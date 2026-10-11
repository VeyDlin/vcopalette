import { describe, expect, it } from 'vitest';

import { createPchip } from '../src/math/pchip';
import type { Curve } from '../src/math/pchip';


describe('createPchip', (): void => {
    it('passes through every knot', (): void => {
        const xs: number[] = [0, 1, 2, 3, 4];
        const ys: number[] = [0.2, 0.5, 0.4, 0.9, 1.0];
        const curve: Curve = createPchip(xs, ys);

        for (let i: number = 0; i < xs.length; i++) {
            expect(curve(xs[i])).toBeCloseTo(ys[i], 12);
        }
    });

    it('stays monotone for monotone data', (): void => {
        const curve: Curve = createPchip([0, 200, 400, 600, 1000], [0.95, 0.8, 0.6, 0.3, 0.05]);
        let previous: number = Number.POSITIVE_INFINITY;

        for (let key: number = 0; key <= 1000; key += 10) {
            const value: number = curve(key);

            expect(value).toBeLessThanOrEqual(previous + 1e-12);
            previous = value;
        }
    });

    it('does not overshoot between knots', (): void => {
        const curve: Curve = createPchip([0, 1, 2, 3], [0, 0, 1, 1]);

        for (let x: number = 0; x <= 3; x += 0.01) {
            const value: number = curve(x);

            expect(value).toBeGreaterThanOrEqual(-1e-12);
            expect(value).toBeLessThanOrEqual(1 + 1e-12);
        }
    });

    it('holds the end values outside the range', (): void => {
        const curve: Curve = createPchip([10, 20, 30], [0.1, 0.5, 0.7]);

        expect(curve(-5)).toBe(0.1);
        expect(curve(10)).toBe(0.1);
        expect(curve(40)).toBe(0.7);
        expect(curve(1000)).toBe(0.7);
    });

    it('is constant for a single knot', (): void => {
        const curve: Curve = createPchip([5], [0.3]);

        expect(curve(0)).toBe(0.3);
        expect(curve(5)).toBe(0.3);
        expect(curve(100)).toBe(0.3);
    });
});
