import type { ComputedRef, Ref } from 'vue';
import type { ColorConfig, Palette, PaletteConfig, PaletteIssue, PaletteToken, Pin, Strength } from 'vcopalette';
import type { NuxtUiAlias, NuxtUiAliases } from 'vcopalette/nuxt-ui';
import { DEFAULT_KEYS, generate, validate } from 'vcopalette';
import { computed, ref, watch } from 'vue';
import { defaultAliases, defaultConfig } from '~/utils/default-config';


export interface PinRef {
    color: string;
    key: number;
}

export interface Playground {
    config: Readonly<Ref<PaletteConfig>>;
    aliases: Readonly<Ref<NuxtUiAliases>>;
    palette: ComputedRef<Palette>;
    selected: Ref<PinRef | null>;
    findPin(pinRef: PinRef): Pin | undefined;
    tryUpdate(mutate: (draft: PaletteConfig) => void): PaletteIssue[];
    addPin(color: string, key: number, strength: number): PaletteIssue[];
    updatePin(pinRef: PinRef, patch: Partial<Pin>): PaletteIssue[];
    removePin(pinRef: PinRef): void;
    removeColor(name: string): void;
    addKey(key: number): PaletteIssue[];
    removeKey(key: number): PaletteIssue[];
    setAliases(next: NuxtUiAliases): void;
    importConfig(json: string): PaletteIssue[];
    exportConfig(): string;
    reset(): void;
}

interface PersistedState {
    config: PaletteConfig;
    aliases: NuxtUiAliases;
}


const STORAGE_KEY: string = 'vcopalette:playground';
/** Shown only for a start color that cannot be computed; such an edit is rejected by validation before it is applied. */
const FALLBACK_HEX: string = '#808080';


function cloneConfig(source: PaletteConfig): PaletteConfig {
    const copy: PaletteConfig = JSON.parse(JSON.stringify(source));

    return copy;
}


function cloneAliases(source: NuxtUiAliases): NuxtUiAliases {
    const copy: NuxtUiAliases = JSON.parse(JSON.stringify(source));

    return copy;
}


function readPersisted(): PersistedState | null {
    try {
        const raw: string | null = localStorage.getItem(STORAGE_KEY);

        if (raw === null) {
            return null;
        }

        const parsed: Partial<PersistedState> | null = JSON.parse(raw);

        if (parsed === null || typeof parsed.config !== 'object' || parsed.config === null) {
            return null;
        }

        if (typeof parsed.config.colors !== 'object' || parsed.config.colors === null) {
            return null;
        }

        if (validate(parsed.config).length > 0) {
            return null;
        }

        const aliases: NuxtUiAliases = typeof parsed.aliases === 'object' && parsed.aliases !== null
            ? parsed.aliases
            : cloneAliases(defaultAliases);

        return { config: parsed.config, aliases: aliases };
    } catch {
        return null;
    }
}


function saveState(state: PersistedState): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // Storage can be blocked (private window, cleared site data); the in-memory state keeps working.
    }
}


function isDefaultStrength(strength: number | Strength | undefined): boolean {
    if (strength === undefined) {
        return false;
    }

    if (typeof strength === 'number') {
        return strength === 1;
    }

    return strength.l === 1 && strength.c === 1;
}


function findPinIn(target: PaletteConfig, pinRef: PinRef): Pin | undefined {
    const colorConfig: ColorConfig | undefined = target.colors[pinRef.color];

    return colorConfig?.pins?.find((pin: Pin): boolean => pin.key === pinRef.key);
}


const initial: PersistedState = readPersisted() ?? {
    config: cloneConfig(defaultConfig),
    aliases: cloneAliases(defaultAliases),
};

const config: Ref<PaletteConfig> = ref<PaletteConfig>(initial.config);
const aliases: Ref<NuxtUiAliases> = ref<NuxtUiAliases>(initial.aliases);
const selected: Ref<PinRef | null> = ref<PinRef | null>(null);
const palette: ComputedRef<Palette> = computed<Palette>((): Palette => generate(config.value));

watch([config, aliases], (): void => {
    saveState({ config: config.value, aliases: aliases.value });
}, { deep: true });


function findPin(pinRef: PinRef): Pin | undefined {
    return findPinIn(config.value, pinRef);
}


function tryUpdate(mutate: (draft: PaletteConfig) => void): PaletteIssue[] {
    const draft: PaletteConfig = cloneConfig(config.value);

    mutate(draft);

    const issues: PaletteIssue[] = validate(draft);

    if (issues.length === 0) {
        config.value = draft;
    }

    return issues;
}


function startingColor(color: string, key: number): string {
    const scale: PaletteToken[] | undefined = palette.value[color];
    const existing: PaletteToken | undefined = scale?.find((token: PaletteToken): boolean => token.key === key);

    if (existing !== undefined) {
        return existing.hex;
    }

    const candidate: PaletteConfig = {
        ...config.value,
        keys: [...new Set<number>([...(config.value.keys ?? DEFAULT_KEYS), key])],
    };

    if (validate(candidate).length > 0) {
        return FALLBACK_HEX;
    }

    const generatedScale: PaletteToken[] | undefined = generate(candidate)[color];
    const generatedToken: PaletteToken | undefined = generatedScale?.find((token: PaletteToken): boolean => token.key === key);

    return generatedToken?.hex ?? FALLBACK_HEX;
}


function addPin(color: string, key: number, strength: number): PaletteIssue[] {
    if (!Object.hasOwn(config.value.colors, color)) {
        return [{ path: `colors.${color}`, code: 'invalid-name', message: `Color "${color}" does not exist` }];
    }

    const hex: string = startingColor(color, key);
    const pin: Pin = { key: key, color: hex };

    if (strength !== 1) {
        pin.strength = strength;
    }

    const issues: PaletteIssue[] = tryUpdate((draft: PaletteConfig): void => {
        const colorConfig: ColorConfig | undefined = draft.colors[color];

        if (colorConfig === undefined) {
            return;
        }

        colorConfig.pins = [...(colorConfig.pins ?? []), pin];
    });

    if (issues.length === 0) {
        selected.value = { color: color, key: key };
    }

    return issues;
}


function updatePin(pinRef: PinRef, patch: Partial<Pin>): PaletteIssue[] {
    const current: PinRef | null = selected.value;
    const wasSelected: boolean = current !== null && current.color === pinRef.color && current.key === pinRef.key;

    const issues: PaletteIssue[] = tryUpdate((draft: PaletteConfig): void => {
        const pin: Pin | undefined = findPinIn(draft, pinRef);

        if (pin === undefined) {
            return;
        }

        Object.assign(pin, patch);

        if (isDefaultStrength(pin.strength)) {
            delete pin.strength;
        }
    });

    if (issues.length === 0 && wasSelected && patch.key !== undefined) {
        selected.value = { color: pinRef.color, key: patch.key };
    }

    return issues;
}


function removePin(pinRef: PinRef): void {
    tryUpdate((draft: PaletteConfig): void => {
        const colorConfig: ColorConfig | undefined = draft.colors[pinRef.color];

        if (colorConfig === undefined) {
            return;
        }

        colorConfig.pins = (colorConfig.pins ?? []).filter((pin: Pin): boolean => pin.key !== pinRef.key);
    });

    const current: PinRef | null = selected.value;

    if (current !== null && current.color === pinRef.color && current.key === pinRef.key) {
        selected.value = null;
    }
}


function removeColor(name: string): void {
    const issues: PaletteIssue[] = tryUpdate((draft: PaletteConfig): void => {
        delete draft.colors[name];
    });

    if (issues.length > 0) {
        return;
    }

    const nextAliases: NuxtUiAliases = cloneAliases(aliases.value);

    for (const alias of Object.keys(nextAliases) as NuxtUiAlias[]) {
        if (nextAliases[alias] === name) {
            delete nextAliases[alias];
        }
    }

    aliases.value = nextAliases;

    const current: PinRef | null = selected.value;

    if (current !== null && current.color === name) {
        selected.value = null;
    }
}


function addKey(key: number): PaletteIssue[] {
    return tryUpdate((draft: PaletteConfig): void => {
        const keys: number[] = draft.keys ?? [...DEFAULT_KEYS];

        draft.keys = [...keys, key].sort((first: number, second: number): number => first - second);
    });
}


function removeKey(key: number): PaletteIssue[] {
    if (config.value.keys === undefined || !config.value.keys.includes(key)) {
        return [];
    }

    return tryUpdate((draft: PaletteConfig): void => {
        draft.keys = (draft.keys ?? []).filter((candidate: number): boolean => candidate !== key);
    });
}


function setAliases(next: NuxtUiAliases): void {
    aliases.value = cloneAliases(next);
}


function importConfig(json: string): PaletteIssue[] {
    let parsed: PaletteConfig;

    try {
        parsed = JSON.parse(json);
    } catch (error: unknown) {
        return [{ path: '', code: 'invalid-color', message: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}` }];
    }

    if (typeof parsed !== 'object' || parsed === null || typeof parsed.colors !== 'object' || parsed.colors === null) {
        return [{ path: '', code: 'invalid-color', message: 'Config must be an object with a "colors" map' }];
    }

    const issues: PaletteIssue[] = validate(parsed);

    if (issues.length > 0) {
        return issues;
    }

    config.value = parsed;

    const current: PinRef | null = selected.value;

    if (current !== null && findPinIn(parsed, current) === undefined) {
        selected.value = null;
    }

    return [];
}


function exportConfig(): string {
    return JSON.stringify(config.value, null, 4);
}


function reset(): void {
    config.value = cloneConfig(defaultConfig);
    aliases.value = cloneAliases(defaultAliases);
    selected.value = null;
}


const playground: Playground = {
    config: config,
    aliases: aliases,
    palette: palette,
    selected: selected,
    findPin: findPin,
    tryUpdate: tryUpdate,
    addPin: addPin,
    updatePin: updatePin,
    removePin: removePin,
    removeColor: removeColor,
    addKey: addKey,
    removeKey: removeKey,
    setAliases: setAliases,
    importConfig: importConfig,
    exportConfig: exportConfig,
    reset: reset,
};


export function usePlayground(): Playground {
    return playground;
}
