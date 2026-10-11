import { describe, expect, it } from 'vitest';

import { isotonicNonIncreasing } from '../src/math/isotonic';


describe('isotonicNonIncreasing', (): void => {
    it('pools adjacent violators', (): void => {
        expect(isotonicNonIncreasing([3, 1, 2], [1, 1, 1])).toEqual([3, 1.5, 1.5]);
    });

    it('leaves non-increasing input unchanged', (): void => {
        expect(isotonicNonIncreasing([5, 4, 4, 1], [1, 2, 3, 4])).toEqual([5, 4, 4, 1]);
    });

    it('respects weights', (): void => {
        expect(isotonicNonIncreasing([1, 2], [3, 1])).toEqual([1.25, 1.25]);
    });
});
