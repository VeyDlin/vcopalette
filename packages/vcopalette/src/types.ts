export type ColorGroup = 'chromatic' | 'neutral';

/** Fraction of the way from the consensus to the pin color: 1 = the pin color, 0 = the consensus. */
export interface Strength {
    l: number;
    c: number;
}

/** An exact color placed on a key of a color scale, with a strength. */
export interface Pin {
    /** Integer 0–1000. */
    key: number;
    /** Any CSS color culori parses. */
    color: string;
    /** 0–1, default 1. A number sets both lightness and chroma strength. */
    strength?: number | Strength;
    /** Token name, e.g. 'page-bg'. Adapters emit it as a semantic variable. */
    name?: string;
}

export interface ColorConfig {
    /** Chroma consensus group. Default 'chromatic'. */
    group?: ColorGroup;
    /** OKLCH hue in [0, 360), used when the color has no hue-carrying pins. */
    hue?: number;
    pins?: Pin[];
}

export interface PaletteConfig {
    /** Keys every color emits; pinned keys are added on top. Default: 50, 100, 200 … 900, 950. */
    keys?: number[];
    colors: Record<string, ColorConfig>;
}

export interface Oklch {
    l: number;
    c: number;
    h: number;
}

export interface PaletteToken {
    key: number;
    /** Lowercase #rrggbb. */
    hex: string;
    /** OKLCH of `hex`; h is 0 for achromatic colors. */
    oklch: Oklch;
    /** Name of the pin on this key. */
    name?: string;
    /** Present when a pin sits on this key. */
    pin?: { strength: Strength };
}

export type Palette = Record<string, PaletteToken[]>;

export type PaletteIssueCode =
    | 'invalid-name'
    | 'name-conflict'
    | 'invalid-key'
    | 'duplicate-key'
    | 'invalid-color'
    | 'invalid-strength'
    | 'invalid-hue'
    | 'missing-hue'
    | 'invalid-group'
    | 'lightness-order';

export interface PaletteIssue {
    /** Path into the config, e.g. 'colors.blue.pins[1].key'. */
    path: string;
    code: PaletteIssueCode;
    message: string;
}
