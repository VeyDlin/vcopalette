import { describe, expect, it } from 'vitest';

import { generate } from '../src/generate';
import { PaletteConfigError } from '../src/errors';
import { validate } from '../src/validate';
import type { PaletteConfig, PaletteIssue } from '../src/types';
import { referenceConfig } from './fixtures/reference';


function summarize(issues: readonly PaletteIssue[]): string[] {
    return issues.map((issue: PaletteIssue): string => `${issue.code} ${issue.path}`);
}


describe('validate', (): void => {
    it('accepts the reference config', (): void => {
        expect(validate(referenceConfig)).toEqual([]);
    });

    it('accepts an empty colors object', (): void => {
        expect(validate({ colors: {} })).toEqual([]);
    });

    it('reports invalid-name on a color', (): void => {
        expect(summarize(validate({ colors: { Blue: { hue: 200 } } }))).toEqual(['invalid-name colors.Blue']);
    });

    it('reports invalid-name on a pin', (): void => {
        const config: PaletteConfig = {
            colors: { blue: { hue: 250, pins: [{ key: 400, color: '#58aeee', name: 'Accent' }] } },
        };

        expect(summarize(validate(config))).toEqual(['invalid-name colors.blue.pins[0].name']);
    });

    it('reports name-conflict when a pin name is reused', (): void => {
        const config: PaletteConfig = {
            colors: {
                blue: {
                    hue: 250,
                    pins: [
                        { key: 400, color: '#58aeee', name: 'accent' },
                        { key: 500, color: '#3080d0', name: 'accent' },
                    ],
                },
            },
        };

        expect(summarize(validate(config))).toEqual(['name-conflict colors.blue.pins[1].name']);
    });

    it('reports name-conflict when a pin name equals a color name', (): void => {
        const config: PaletteConfig = {
            colors: {
                blue: { hue: 250, pins: [{ key: 400, color: '#58aeee', name: 'red' }] },
                red: { hue: 20 },
            },
        };

        expect(summarize(validate(config))).toEqual(['name-conflict colors.blue.pins[0].name']);
    });

    it('reports invalid-key on a pin', (): void => {
        const config: PaletteConfig = {
            colors: { blue: { hue: 250, pins: [{ key: 1001, color: '#58aeee' }] } },
        };

        expect(summarize(validate(config))).toEqual(['invalid-key colors.blue.pins[0].key']);
    });

    it('reports invalid-key in keys', (): void => {
        expect(summarize(validate({ keys: [1.5], colors: {} }))).toEqual(['invalid-key keys[0]']);
    });

    it('reports duplicate-key in keys', (): void => {
        expect(summarize(validate({ keys: [100, 100], colors: {} }))).toEqual(['duplicate-key keys[1]']);
    });

    it('reports duplicate-key when one color has two pins on a key', (): void => {
        const config: PaletteConfig = {
            colors: {
                blue: {
                    hue: 250,
                    pins: [
                        { key: 400, color: '#58aeee' },
                        { key: 400, color: '#3080d0' },
                    ],
                },
            },
        };

        expect(summarize(validate(config))).toEqual(['duplicate-key colors.blue.pins[1].key']);
    });

    it('reports invalid-color on a pin', (): void => {
        const config: PaletteConfig = {
            colors: { blue: { hue: 250, pins: [{ key: 400, color: 'not a color' }] } },
        };

        expect(summarize(validate(config))).toEqual(['invalid-color colors.blue.pins[0].color']);
    });

    it('reports invalid-strength on a lightness strength', (): void => {
        const config: PaletteConfig = {
            colors: {
                red: { hue: 20, pins: [{ key: 400, color: '#ff595a', strength: { l: 1.5, c: 1 } }] },
            },
        };

        expect(summarize(validate(config))).toEqual(['invalid-strength colors.red.pins[0].strength.l']);
    });

    it('reports invalid-strength on a number strength', (): void => {
        const config: PaletteConfig = {
            colors: { red: { hue: 20, pins: [{ key: 400, color: '#ff595a', strength: 2 }] } },
        };

        expect(summarize(validate(config))).toEqual(['invalid-strength colors.red.pins[0].strength']);
    });

    it('reports invalid-hue', (): void => {
        expect(summarize(validate({ colors: { cyan: { hue: 360 } } }))).toEqual(['invalid-hue colors.cyan.hue']);
    });

    it('reports invalid-group for a group outside the union (untyped JSON input)', (): void => {
        const config: unknown = JSON.parse('{ "colors": { "cyan": { "group": "warm", "hue": 215 } } }');

        expect(summarize(validate(config as PaletteConfig))).toEqual(['invalid-group colors.cyan.group']);
    });

    it('reports missing-hue for a chromatic color without hue or hue-carrying pins', (): void => {
        expect(summarize(validate({ colors: { cyan: {} } }))).toEqual(['missing-hue colors.cyan']);
    });

    it('reports lightness-order on a nail that is not darker than the previous one', (): void => {
        const config: PaletteConfig = {
            colors: {
                neutral: {
                    group: 'neutral',
                    pins: [
                        { key: 100, color: '#333' },
                        { key: 900, color: '#eee' },
                    ],
                },
            },
        };
        const issues: PaletteIssue[] = validate(config);

        expect(summarize(issues)).toEqual(['lightness-order colors.neutral.pins[1]']);
        expect(issues[0].message).toBe('Must be darker than the pin at key 100');
    });
});


describe('generate validation', (): void => {
    it('throws PaletteConfigError carrying the same issues as validate', (): void => {
        const config: PaletteConfig = {
            colors: {
                Blue: { hue: 200 },
                cyan: {},
            },
        };
        const issues: PaletteIssue[] = validate(config);
        let thrown: PaletteConfigError | undefined;

        expect(issues.length).toBeGreaterThan(0);

        try {
            generate(config);
        } catch (error: unknown) {
            if (error instanceof PaletteConfigError) {
                thrown = error;
            }
        }

        expect(thrown?.issues).toEqual(issues);
    });
});
