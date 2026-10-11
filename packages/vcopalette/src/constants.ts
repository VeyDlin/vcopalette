export const MIN_KEY: number = 0;
export const MAX_KEY: number = 1000;

export const DEFAULT_KEYS: readonly number[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

/** Pins below this chroma carry no hue. */
export const ACHROMATIC_CHROMA: number = 0.004;

/** Chromatic chroma fallback when the chromatic group has no pins. */
export const DEFAULT_PEAK_CHROMA: number = 0.15;

/** Minimum lightness gap between adjacent output keys after correction. */
export const LIGHTNESS_EPSILON: number = 0.0005;

export const NAME_PATTERN: RegExp = /^[a-z][a-z0-9-]*$/;
