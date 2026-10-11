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
- **Magnet**: any other pin. It pulls the nearby cells toward its color without forcing them.
- **Consensus**: the shared curves every color returns to away from its own pins. It is built from all pins.

## Usage

```ts
import { generate } from 'vcopalette';

const palette = generate({
    colors: {
        neutral: {
            group: 'neutral',
            pins: [
                { key: 0, color: '#FFFFFF', name: 'text' },
                { key: 300, color: '#AAAAAA', name: 'text-secondary' },
                { key: 950, color: '#0F1115', name: 'page-bg' },
            ],
        },
        blue: {
            pins: [
                { key: 400, color: '#58AEEE', name: 'accent' },
                { key: 850, color: '#1E3445', name: 'accent-fill' },
            ],
        },
        cyan: { hue: 215 },
    },
});
```

`generate` returns a record from color name to its tokens, sorted by key:

```ts
palette.blue;
// [
//   { key: 50, hex: '#...', oklch: { l, c, h } },
//   ...
//   { key: 400, hex: '#58aeee', oklch: { l, c, h }, name: 'accent', pin: { strength: { l: 1, c: 1 } } },
//   ...
//   { key: 850, hex: '#1e3445', oklch: { l, c, h }, name: 'accent-fill', pin: { strength: { l: 1, c: 1 } } },
//   ...
// ]
```

Each token has a lowercase `hex`, its `oklch` value, and, where a pin sits on that key, its `name` and `pin.strength`. Output keys are the config's `keys` plus the keys of that color's own pins.

## Validation

`validate(config)` returns every problem in the config as `{ path, code, message }` issues and never throws. `generate` throws a `PaletteConfigError` whose `issues` field holds the same list.

## Adapters

Each adapter is a subpath export, so unused adapters are not bundled.

### CSS: `vcopalette/css`

```ts
import { toCss, injectCss } from 'vcopalette/css';

const css = toCss(palette);     // :root { --color-blue-400: #58aeee; --accent: var(--color-blue-400); ... }
injectCss(css);                 // creates or updates <style id="vcopalette"> in the document head
```

### Tailwind v4: `vcopalette/tailwind`

```ts
import { toTailwindTheme } from 'vcopalette/tailwind';

const theme = toTailwindTheme(palette); // @theme and @theme inline blocks, so bg-blue-850 and bg-accent work
```

Write the result to a CSS file that your Tailwind v4 entry imports.

### Nuxt UI: `vcopalette/nuxt-ui`

```ts
import { toNuxtUi } from 'vcopalette/nuxt-ui';

const { css, appConfig } = toNuxtUi(palette, { primary: 'blue', neutral: 'neutral' });
// css: a :root stylesheet, for a stylesheet or injectCss
// appConfig: { ui: { colors: { primary: 'blue', neutral: 'neutral' } } }, to merge into app.config.ts
```

### W3C design tokens: `vcopalette/dtcg`

```ts
import { toDtcg } from 'vcopalette/dtcg';

const tokens = toDtcg(palette); // W3C Design Tokens (2025.10) for Style Dictionary or Tokens Studio
```

## License

MIT
