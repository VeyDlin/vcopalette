# vcopalette

vcopalette generates color palettes from a few exact colors. A designer pins their accent, surfaces, text and status colors onto color scales, and vcopalette generates every other step of every scale so the whole palette stays consistent. Colors the designer never specified are derived in the same style. The output can be emitted as CSS variables, a Tailwind v4 theme, a Nuxt UI theme or W3C design tokens.

## Usage

```sh
npm install vcopalette
```

### Generate a palette

Pin the designer's colors to keys (0 is the white end, 1000 the black end). Pins are exact; every other step, and every color without pins, is derived from them.

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

A pin with `strength` below 1 is a magnet: `{ key: 400, color: '#FF595A', strength: 0.5 }` lands halfway between the designer's color and what the rest of the palette suggests for that key. `strength: { l: 0.3, c: 1 }` keeps the chroma exact and pulls only the lightness toward the others.

### Tailwind v4

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

### Nuxt UI

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

### Plain CSS variables

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

### Design tokens

```ts
import { toDtcg } from 'vcopalette/dtcg';

const tokens = toDtcg(palette); // W3C Design Tokens for Style Dictionary or Tokens Studio (Figma)
```

### Validation

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

`generate` throws a `PaletteConfigError` with the same `issues` when the config is invalid.

## Repository layout

- `packages/vcopalette`: the npm package `vcopalette`. See its [README](packages/vcopalette/README.md).
- `playground/`: a Nuxt app that edits a config visually and previews it on Nuxt UI components.

## Commands

```sh
npm install         # install all workspaces
npm run dev         # start the playground
npm test            # run package tests
npm run typecheck   # type-check the package and the playground
npm run build       # build the package
```

## Releasing

1. Bump `version` in `packages/vcopalette/package.json` and push to `main` or `master`.
2. The Release workflow (`.github/workflows/release.yml`) compares that version with npm. If it is new, it type-checks, tests and builds the package, publishes it to npm through trusted publishing (GitHub OIDC, configured on the package's npm settings page, no stored token), then tags `v<version>` and creates a GitHub Release with generated notes.

To release without a version bump, run the Release workflow manually. If the version is already on npm, the workflow skips publishing.

## License

MIT
