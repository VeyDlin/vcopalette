# vcopalette

Pin a designer's exact colors onto color scales, and vcopalette generates every other step so the whole palette stays consistent and follows the designer's style. Lightness is shared across all colors, chroma is shared within a group, and colors the designer never specified are derived from the same consensus.

## Install

```sh
npm install vcopalette
```

## Concepts

- **Key**: a position on a scale, an integer from 0 (white end) to 1000 (black end). Default output keys are 50, 100 … 900, 950.
- **Color**: a named scale such as `neutral` or `blue`. Each color belongs to a group, `chromatic` (default) or `neutral`, and can set a `hue` when it has no hue-carrying pins.
- **Pin**: an exact color placed on a key of a color, with a strength. Strength is how far the output moves from the consensus toward the pin, from 0 to 1. Lightness and chroma can have separate strengths, `{ l, c }`.
- **Nail**: a pin with both strengths at 1. Its cell outputs exactly the pin's hex.
- **Magnet**: any other pin. It pulls its cell toward its color without forcing it.
- **Consensus**: the shared curves every color returns to away from its own pins. It is built from all pins.

## Generate a palette

```ts
import type { PaletteConfig } from 'vcopalette';
import { generate } from 'vcopalette';

export const config: PaletteConfig = {
    colors: {
        neutral: {
            group: 'neutral',
            pins: [
                { key: 0, color: '#FFFFFF', name: 'text' },
                { key: 900, color: '#1D2128', name: 'panel' },
                { key: 950, color: '#0F1115', name: 'page-bg' },
            ],
        },
        blue: {
            pins: [
                { key: 400, color: '#58AEEE', name: 'accent' },
                { key: 850, color: '#1E3445', name: 'accent-fill' },
            ],
        },
        red: {
            pins: [{ key: 400, color: '#FF595A', name: 'error' }],
        },
        // No pins: lightness and chroma come from the other colors, only the hue is its own.
        cyan: { hue: 215 },
    },
};

const palette = generate(config);

palette.blue.find((token) => token.key === 400)?.hex; // '#58aeee', exactly the pinned color
palette.cyan.find((token) => token.key === 400)?.hex; // '#00b3d0', derived in the same style
```

`generate` returns a record from color name to its tokens, sorted by key. Each token has a lowercase `hex`, its `oklch` value, and, where a pin sits on that key, its `name` and `pin.strength`. Output keys are the config's `keys` plus the keys of that color's own pins.

A pin with `strength` below 1 is a magnet: `{ key: 400, color: '#FF595A', strength: 0.5 }` lands halfway between the designer's color and what the rest of the palette suggests for that key. `strength: { l: 0.3, c: 1 }` keeps the chroma exact and pulls only the lightness toward the others.

## Tailwind v4

Write the theme once at build time and import it from your CSS entry:

```ts
// scripts/palette.ts
import { writeFileSync } from 'node:fs';
import { generate } from 'vcopalette';
import { toTailwindTheme } from 'vcopalette/tailwind';
import { config } from '../palette.config';

writeFileSync('src/palette.css', toTailwindTheme(generate(config)));
```

```css
@import 'tailwindcss';
@import './palette.css';
```

```html
<div class="bg-neutral-950 text-neutral-0">
    <button class="bg-accent">Save</button>
    <span class="text-blue-300">Every step is a utility: blue-50 … blue-950</span>
</div>
```

## Nuxt UI

Generate at runtime, for example to let users switch accents:

```ts
// plugins/palette.client.ts
import { generate } from 'vcopalette';
import { injectCss } from 'vcopalette/css';
import { toNuxtUi } from 'vcopalette/nuxt-ui';
import { config } from '~/palette.config';

export default defineNuxtPlugin(() => {
    const theme = toNuxtUi(generate(config), { primary: 'blue', error: 'red', neutral: 'neutral' });

    injectCss(theme.css);
    Object.assign(useAppConfig().ui.colors, theme.appConfig.ui.colors);
});
```

For a static theme, write `theme.css` into a stylesheet and put `theme.appConfig` into `app.config.ts`.

## Plain CSS variables

```ts
import { toCss } from 'vcopalette/css';

toCss(palette);
// :root {
//     --color-neutral-0: #ffffff;
//     --color-neutral-50: #f3f4f5;
//     ...
//     --accent: var(--color-blue-400);
//     --accent-fill: var(--color-blue-850);
//     --error: var(--color-red-400);
// }
```

`injectCss(css)` creates or updates `<style id="vcopalette">` in the document head.

## Design tokens

```ts
import { toDtcg } from 'vcopalette/dtcg';

const tokens = toDtcg(palette); // W3C Design Tokens (2025.10) for Style Dictionary or Tokens Studio (Figma)
```

## Validation

```ts
import { validate } from 'vcopalette';

validate({
    colors: {
        neutral: {
            group: 'neutral',
            pins: [
                { key: 300, color: '#AAAAAA' },
                { key: 900, color: '#EEEEEE' },
            ],
        },
    },
});
// [{ path: 'colors.neutral.pins[1]', code: 'lightness-order', message: 'Must be darker than the pin at key 300' }]
```

`validate` never throws. `generate` throws a `PaletteConfigError` with the same `issues` when the config is invalid.

## License

MIT
