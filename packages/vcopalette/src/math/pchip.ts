export type Curve = (x: number) => number;


/** xs strictly increasing. Passes through every knot, never overshoots, holds end values outside the range. */
export function createPchip(xs: readonly number[], ys: readonly number[]): Curve {
    const n: number = xs.length;

    if (n === 0) {
        throw new Error('createPchip needs at least one knot');
    }

    if (n === 1) {
        const only: number = ys[0];

        return (): number => only;
    }

    const h: number[] = [];
    const delta: number[] = [];

    for (let i: number = 0; i < n - 1; i++) {
        h.push(xs[i + 1] - xs[i]);
        delta.push((ys[i + 1] - ys[i]) / h[i]);
    }

    const m: number[] = new Array<number>(n).fill(0);

    if (n === 2) {
        m[0] = delta[0];
        m[1] = delta[0];
    } else {
        for (let i: number = 1; i < n - 1; i++) {
            if (delta[i - 1] * delta[i] <= 0) {
                m[i] = 0;
            } else {
                const w1: number = 2 * h[i] + h[i - 1];
                const w2: number = h[i] + 2 * h[i - 1];

                m[i] = (w1 + w2) / (w1 / delta[i - 1] + w2 / delta[i]);
            }
        }

        m[0] = endSlope(h[0], h[1], delta[0], delta[1]);
        m[n - 1] = endSlope(h[n - 2], h[n - 3], delta[n - 2], delta[n - 3]);
    }

    return (x: number): number => {
        if (x <= xs[0]) {
            return ys[0];
        }

        if (x >= xs[n - 1]) {
            return ys[n - 1];
        }

        let lo: number = 0;
        let hi: number = n - 1;

        while (hi - lo > 1) {
            const mid: number = (lo + hi) >> 1;

            if (xs[mid] <= x) {
                lo = mid;
            } else {
                hi = mid;
            }
        }

        const t: number = (x - xs[lo]) / h[lo];
        const t2: number = t * t;
        const t3: number = t2 * t;

        return (2 * t3 - 3 * t2 + 1) * ys[lo]
            + (t3 - 2 * t2 + t) * h[lo] * m[lo]
            + (-2 * t3 + 3 * t2) * ys[lo + 1]
            + (t3 - t2) * h[lo] * m[lo + 1];
    };
}


function endSlope(h0: number, h1: number, d0: number, d1: number): number {
    const m: number = ((2 * h0 + h1) * d0 - h0 * d1) / (h0 + h1);

    if (Math.sign(m) !== Math.sign(d0)) {
        return 0;
    }

    if (Math.sign(d0) !== Math.sign(d1) && Math.abs(m) > Math.abs(3 * d0)) {
        return 3 * d0;
    }

    return m;
}
