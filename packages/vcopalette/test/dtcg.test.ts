import { describe, expect, it } from 'vitest';

import { generate } from '../src/index';
import { toDtcg } from '../src/dtcg';
import type { DtcgColorToken, DtcgTokens } from '../src/dtcg';
import type { Palette } from '../src/types';
import { referenceConfig } from './fixtures/reference';


describe('toDtcg', (): void => {
    it('emits cells with srgb components and hex', (): void => {
        const palette: Palette = generate(referenceConfig);
        const tokens: DtcgTokens = toDtcg(palette);
        const blue: Record<string, DtcgColorToken> = tokens.blue as Record<string, DtcgColorToken>;
        const accent: DtcgColorToken = blue['400'];

        expect(accent.$type).toBe('color');
        expect(accent.$value).toEqual({
            colorSpace: 'srgb',
            components: [0.3451, 0.6824, 0.9333],
            hex: '#58aeee',
        });
    });

    it('emits named pins as top-level alias tokens', (): void => {
        const palette: Palette = generate(referenceConfig);
        const tokens: DtcgTokens = toDtcg(palette);

        expect(tokens.accent).toEqual({ $type: 'color', $value: '{blue.400}' });
    });

    it('matches the reference snapshot', (): void => {
        expect(toDtcg(generate(referenceConfig))).toMatchSnapshot();
    });
});
