import { describe, expect, it } from 'vitest';

import { toTailwindTheme } from '../src/tailwind';
import { generate } from '../src/index';
import type { Palette, PaletteConfig } from '../src/types';
import { referenceConfig } from './fixtures/reference';


describe('toTailwindTheme', (): void => {
    it('puts cells into the @theme block', (): void => {
        const palette: Palette = generate(referenceConfig);
        const theme: string = toTailwindTheme(palette);
        const block: string = theme.slice(0, theme.indexOf('@theme inline'));

        expect(block).toContain('--color-blue-400: #58aeee;');
    });

    it('puts named pins into the @theme inline block', (): void => {
        const palette: Palette = generate(referenceConfig);
        const theme: string = toTailwindTheme(palette);
        const inline: string = theme.slice(theme.indexOf('@theme inline'));

        expect(inline).toContain('--color-accent: var(--color-blue-400);');
    });

    it('omits the inline block when nothing is named', (): void => {
        const config: PaletteConfig = {
            keys: [400],
            colors: {
                blue: {
                    pins: [
                        { key: 400, color: '#58AEEE' },
                    ],
                },
            },
        };

        const theme: string = toTailwindTheme(generate(config));

        expect(theme).not.toContain('@theme inline');
        expect(theme).toBe('@theme {\n    --color-blue-400: #58aeee;\n}\n');
    });

    it('matches the reference snapshot', (): void => {
        expect(toTailwindTheme(generate(referenceConfig))).toMatchSnapshot();
    });
});
