import { formatHex, parse } from 'culori';
import type { Color } from 'culori';
import { describe, expect, it } from 'vitest';

import { generate } from '../src/generate';
import type { Palette, PaletteConfig, PaletteToken, Pin } from '../src/types';
import { referenceConfig } from './fixtures/reference';


const TOLERANCE: number = 0.004;
const HUE_TOLERANCE: number = 2;
const NEAR_BLACK_L: number = 0.15;


function hexOf(color: string): string {
    const parsed: Color | undefined = parse(color);
    const hex: string | undefined = parsed === undefined ? undefined : formatHex(parsed);

    if (hex === undefined) {
        throw new Error(`Cannot format ${color}`);
    }

    return hex.toLowerCase();
}

function tokenAt(palette: Palette, color: string, key: number): PaletteToken {
    const token: PaletteToken | undefined = palette[color]?.find((candidate: PaletteToken): boolean => candidate.key === key);

    if (token === undefined) {
        throw new Error(`No token ${color}-${key}`);
    }

    return token;
}

function angularDistance(a: number, b: number): number {
    const difference: number = Math.abs(a - b) % 360;

    return Math.min(difference, 360 - difference);
}

function strengthConfig(strength: number | { l: number; c: number }): PaletteConfig {
    return {
        colors: {
            a: { pins: [{ key: 500, color: 'oklch(0.6 0.1 30)', strength: strength }] },
            b: { pins: [{ key: 500, color: 'oklch(0.5 0.08 250)' }] },
        },
    };
}


describe('generate', (): void => {
    it('outputs every reference pin exactly, with its name', (): void => {
        const palette: Palette = generate(referenceConfig);

        for (const [colorName, colorConfig] of Object.entries(referenceConfig.colors)) {
            for (const pin of colorConfig.pins ?? []) {
                const token: PaletteToken = tokenAt(palette, colorName, pin.key);

                expect(token.hex).toBe(hexOf(pin.color));
                expect(token.name).toBe(pin.name);
            }
        }
    });

    it('applies lightness and chroma strengths', (): void => {
        const halfway: PaletteToken = tokenAt(generate(strengthConfig(0)), 'a', 500);
        const midway: PaletteToken = tokenAt(generate(strengthConfig(0.5)), 'a', 500);
        const chromaOnly: PaletteToken = tokenAt(generate(strengthConfig({ l: 1, c: 0 })), 'a', 500);

        expect(halfway.oklch.l).toBeCloseTo(0.55, 2);
        expect(halfway.oklch.c).toBeCloseTo(0.09, 2);

        expect(midway.oklch.l).toBeCloseTo(0.575, 2);
        expect(midway.oklch.c).toBeCloseTo(0.095, 2);

        expect(chromaOnly.oklch.l).toBeCloseTo(0.6, 2);
        expect(chromaOnly.oklch.c).toBeCloseTo(0.09, 2);
    });

    it.each([
        ['reference', referenceConfig],
        ['conflicting magnets', conflictingConfig()],
    ])('never raises lightness along a color (%s)', (label: string, config: PaletteConfig): void => {
        const palette: Palette = generate(config);

        for (const [colorName, tokens] of Object.entries(palette)) {
            for (let i: number = 0; i + 1 < tokens.length; i++) {
                expect(tokens[i + 1].key, colorName).toBeGreaterThan(tokens[i].key);
                expect(tokens[i + 1].oklch.l, colorName).toBeLessThan(tokens[i].oklch.l + 0.003);
            }
        }
    });

    it('makes a color without pins follow the consensus', (): void => {
        const palette: Palette = generate({
            colors: {
                a: { pins: [{ key: 500, color: 'oklch(0.6 0.07 30)' }] },
                cyan: { hue: 215 },
            },
        });
        const cyan500: PaletteToken = tokenAt(palette, 'cyan', 500);

        expect(cyan500.oklch.l).toBeCloseTo(0.6, 2);
        expect(cyan500.oklch.c).toBeCloseTo(0.07, 2);
        expect(angularDistance(cyan500.oklch.h, 215)).toBeLessThan(HUE_TOLERANCE);

        for (const token of palette.cyan) {
            const counterpart: PaletteToken = tokenAt(palette, 'a', token.key);

            // Near black one 8-bit sRGB step moves OKLCH L by 0.01–0.02, so two hues
            // with the same computed lightness cannot round to the same L there.
            if (counterpart.oklch.l < NEAR_BLACK_L) {
                continue;
            }

            expect(Math.abs(token.oklch.l - counterpart.oklch.l)).toBeLessThan(TOLERANCE);
        }
    });

    it('interpolates hue across 0 along the short arc', (): void => {
        const palette: Palette = generate({
            colors: {
                w: {
                    pins: [
                        { key: 300, color: 'oklch(0.7 0.12 350)' },
                        { key: 700, color: 'oklch(0.45 0.12 10)' },
                    ],
                },
            },
        });
        const hue: number = tokenAt(palette, 'w', 500).oklch.h;

        expect(angularDistance(hue, 0)).toBeLessThan(5);
    });

    it('emits lowercase hex inside the reference palette and the neutral extra keys', (): void => {
        const palette: Palette = generate(referenceConfig);

        for (const tokens of Object.values(palette)) {
            for (const token of tokens) {
                expect(token.hex).toMatch(/^#[0-9a-f]{6}$/);
            }
        }

        const neutralKeys: number[] = palette.neutral.map((token: PaletteToken): number => token.key);

        expect(neutralKeys).toEqual(expect.arrayContaining([0, 780, 830, 870]));
    });

    it('matches the reference snapshot', (): void => {
        expect(generate(referenceConfig)).toMatchSnapshot();
    });
});


function conflictingConfig(): PaletteConfig {
    const magnets: Pin[] = [
        { key: 300, color: 'oklch(0.35 0.1 40)', strength: 0.8 },
        { key: 600, color: 'oklch(0.85 0.1 40)', strength: 0.8 },
    ];

    return {
        colors: {
            x: { hue: 40, pins: magnets },
            nail: {
                hue: 200,
                pins: [
                    { key: 300, color: 'oklch(0.5 0.1 200)' },
                    { key: 600, color: 'oklch(0.3 0.1 200)' },
                ],
            },
        },
    };
}
