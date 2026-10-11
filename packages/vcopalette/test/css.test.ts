import { describe, expect, it } from 'vitest';

import { toCss } from '../src/css';
import { generate } from '../src/index';
import type { Palette, PaletteConfig } from '../src/types';
import { referenceConfig } from './fixtures/reference';


const tinyConfig: PaletteConfig = {
    keys: [400],
    colors: {
        blue: {
            pins: [
                { key: 400, color: '#58AEEE', name: 'accent' },
            ],
        },
    },
};


describe('toCss', (): void => {
    it('emits cells and named aliases for a tiny palette', (): void => {
        const palette: Palette = generate(tinyConfig);

        expect(toCss(palette)).toBe(':root {\n    --color-blue-400: #58aeee;\n    --accent: var(--color-blue-400);\n}\n');
    });

    it('lists all cell lines before alias lines', (): void => {
        const palette: Palette = generate(referenceConfig);
        const css: string = toCss(palette);
        const lastCell: number = css.lastIndexOf('    --color-');
        const firstAlias: number = css.indexOf('    --accent:');

        expect(lastCell).toBeLessThan(firstAlias);
    });

    it('respects a custom selector and prefix', (): void => {
        const palette: Palette = generate(tinyConfig);

        expect(toCss(palette, { selector: '.theme', prefix: 'c' })).toBe('.theme {\n    --c-blue-400: #58aeee;\n    --accent: var(--c-blue-400);\n}\n');
    });
});
