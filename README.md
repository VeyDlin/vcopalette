# vcopalette

vcopalette generates color palettes from a few exact colors. A designer pins their accent, surfaces, text and status colors onto color scales, and vcopalette generates every other step of every scale so the whole palette stays consistent. Colors the designer never specified are derived in the same style. The output can be emitted as CSS variables, a Tailwind v4 theme, a Nuxt UI theme or W3C design tokens.

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
2. The Release workflow (`.github/workflows/release.yml`) compares that version with npm. If it is new, it type-checks, tests and builds the package, publishes it to npm with the `NPM_TOKEN` secret, then tags `v<version>` and creates a GitHub Release with generated notes.

To release without a version bump, run the Release workflow manually. If the version is already on npm, the workflow skips publishing.

## License

MIT
