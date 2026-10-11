import { hexToOklch, oklchToHex } from './color';
import { DEFAULT_KEYS } from './constants';
import { buildChromaConsensus, buildLightnessConsensus } from './consensus';
import { correctLightness } from './correction';
import { buildDeviation } from './deviation';
import type { DeviationPoint } from './deviation';
import { PaletteConfigError } from './errors';
import { buildHue } from './hue';
import type { Curve } from './math/pchip';
import { resolvePins } from './resolve';
import type { ResolvedPin } from './resolve';
import type { ColorConfig, ColorGroup, Palette, PaletteConfig, PaletteIssue, PaletteToken } from './types';
import { validate } from './validate';


export function generate(config: PaletteConfig): Palette {
    const issues: PaletteIssue[] = validate(config);

    if (issues.length > 0) {
        throw new PaletteConfigError(issues);
    }

    const pins: ResolvedPin[] = resolvePins(config);
    const lightness: Curve = buildLightnessConsensus(pins);
    const chroma: Record<ColorGroup, Curve> = {
        chromatic: buildChromaConsensus(pins, 'chromatic'),
        neutral: buildChromaConsensus(pins, 'neutral'),
    };
    const keys: readonly number[] = config.keys ?? DEFAULT_KEYS;
    const palette: Palette = {};

    for (const [colorName, colorConfig] of Object.entries(config.colors)) {
        const own: ResolvedPin[] = pins.filter((pin: ResolvedPin): boolean => pin.colorName === colorName);

        palette[colorName] = buildScale(colorConfig, own, keys, lightness, chroma[colorConfig.group ?? 'chromatic']);
    }

    return palette;
}


function buildScale(
    colorConfig: ColorConfig,
    own: readonly ResolvedPin[],
    keys: readonly number[],
    lightness: Curve,
    chroma: Curve,
): PaletteToken[] {
    const hue: Curve = buildHue(own, colorConfig.hue ?? 0);
    const deltaL: Curve = buildDeviation(own.map((pin: ResolvedPin): DeviationPoint => ({
        key: pin.key,
        value: (pin.l - lightness(pin.key)) * pin.strength.l,
    })));
    const deltaC: Curve = buildDeviation(own.map((pin: ResolvedPin): DeviationPoint => ({
        key: pin.key,
        value: (pin.c - chroma(pin.key)) * pin.strength.c,
    })));

    const allKeys: number[] = [...new Set<number>([...keys, ...own.map((pin: ResolvedPin): number => pin.key)])]
        .sort((a: number, b: number): number => a - b);

    const rawL: number[] = allKeys.map((key: number): number => lightness(key) + deltaL(key));
    const fixed: boolean[] = allKeys.map((key: number): boolean => own.some(
        (pin: ResolvedPin): boolean => pin.key === key && pin.strength.l === 1,
    ));
    const correctedL: number[] = correctLightness(rawL, fixed);

    return allKeys.map((key: number, index: number): PaletteToken => {
        const pin: ResolvedPin | undefined = own.find((candidate: ResolvedPin): boolean => candidate.key === key);
        const exact: ResolvedPin | undefined = own.find((candidate: ResolvedPin): boolean => candidate.key === key
            && candidate.strength.l === 1
            && candidate.strength.c === 1);
        const hex: string = exact !== undefined
            ? exact.hex
            : oklchToHex(correctedL[index], Math.max(0, chroma(key) + deltaC(key)), hue(key));
        const token: PaletteToken = { key: key, hex: hex, oklch: hexToOklch(hex) };

        if (pin !== undefined) {
            token.pin = { strength: { l: pin.strength.l, c: pin.strength.c } };

            if (pin.name !== undefined) {
                token.name = pin.name;
            }
        }

        return token;
    });
}
