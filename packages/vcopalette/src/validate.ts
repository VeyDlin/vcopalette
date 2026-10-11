import { parseColor } from './color';
import type { ParsedColor } from './color';
import { ACHROMATIC_CHROMA, MAX_KEY, MIN_KEY, NAME_PATTERN } from './constants';
import { resolveStrength } from './strength';
import type { ColorConfig, ColorGroup, Pin, PaletteConfig, PaletteIssue, Strength } from './types';


interface UsablePin {
    index: number;
    key: number;
    parsed: ParsedColor;
    strength: Strength;
}

interface ValidationState {
    issues: PaletteIssue[];
    colorNames: ReadonlySet<string>;
    pinNames: Set<string>;
}


const NAME_MESSAGE: string = 'Use lowercase letters, digits and hyphens, starting with a letter';
const KEY_MESSAGE: string = `Key must be an integer from ${MIN_KEY} to ${MAX_KEY}`;
const HUE_MESSAGE: string = 'Hue must be at least 0 and less than 360';
const STRENGTH_MESSAGE: string = 'Strength must be a number from 0 to 1';
const GROUP_MESSAGE: string = 'Group must be "chromatic" or "neutral"';
const GROUPS: readonly ColorGroup[] = ['chromatic', 'neutral'];


/** Collects every issue in the config. Never throws. */
export function validate(config: PaletteConfig): PaletteIssue[] {
    const state: ValidationState = {
        issues: [],
        colorNames: new Set<string>(Object.keys(config.colors)),
        pinNames: new Set<string>(),
    };

    validateKeys(config.keys ?? [], state.issues);

    for (const [colorName, colorConfig] of Object.entries(config.colors)) {
        validateColor(colorName, colorConfig, state);
    }

    return state.issues;
}


function validateKeys(keys: readonly number[], issues: PaletteIssue[]): void {
    const seen: Set<number> = new Set<number>();

    for (let i: number = 0; i < keys.length; i++) {
        const key: number = keys[i];
        const path: string = `keys[${i}]`;

        if (!isValidKey(key)) {
            issues.push({ path: path, code: 'invalid-key', message: KEY_MESSAGE });
        } else if (seen.has(key)) {
            issues.push({ path: path, code: 'duplicate-key', message: `Key ${key} is listed more than once` });
        } else {
            seen.add(key);
        }
    }
}

function validateColor(colorName: string, colorConfig: ColorConfig, state: ValidationState): void {
    const colorPath: string = `colors.${colorName}`;

    if (!NAME_PATTERN.test(colorName)) {
        state.issues.push({ path: colorPath, code: 'invalid-name', message: NAME_MESSAGE });
    }

    if (colorConfig.hue !== undefined && !isValidHue(colorConfig.hue)) {
        state.issues.push({ path: `${colorPath}.hue`, code: 'invalid-hue', message: HUE_MESSAGE });
    }

    // Configs also arrive as untyped JSON (playground import), where the union type does not hold.
    if (colorConfig.group !== undefined && !GROUPS.includes(colorConfig.group)) {
        state.issues.push({ path: `${colorPath}.group`, code: 'invalid-group', message: GROUP_MESSAGE });
    }

    const pins: Pin[] = colorConfig.pins ?? [];
    const seenKeys: Set<number> = new Set<number>();
    const usable: UsablePin[] = [];

    for (let i: number = 0; i < pins.length; i++) {
        const pin: UsablePin | null = validatePin(pins[i], i, colorPath, seenKeys, state);

        if (pin !== null) {
            usable.push(pin);
        }
    }

    const group: ColorGroup = colorConfig.group ?? 'chromatic';

    if (group === 'chromatic' && colorConfig.hue === undefined && !hasHuePin(pins)) {
        state.issues.push({
            path: colorPath,
            code: 'missing-hue',
            message: 'A chromatic color needs a hue, or a pin with visible chroma to take it from',
        });
    }

    checkLightnessOrder(colorPath, usable, state.issues);
}

/** Returns the pin's data when it is usable for the lightness check; reports every issue on the way. */
function validatePin(
    pin: Pin,
    index: number,
    colorPath: string,
    seenKeys: Set<number>,
    state: ValidationState,
): UsablePin | null {
    const pinPath: string = `${colorPath}.pins[${index}]`;

    if (!isValidKey(pin.key)) {
        state.issues.push({ path: `${pinPath}.key`, code: 'invalid-key', message: KEY_MESSAGE });
    } else if (seenKeys.has(pin.key)) {
        state.issues.push({
            path: `${pinPath}.key`,
            code: 'duplicate-key',
            message: `${colorPath} already has a pin on key ${pin.key}`,
        });
    } else {
        seenKeys.add(pin.key);
    }

    const parsed: ParsedColor | null = parseColor(pin.color);

    if (parsed === null) {
        state.issues.push({
            path: `${pinPath}.color`,
            code: 'invalid-color',
            message: `Cannot parse color "${pin.color}"`,
        });
    }

    const strengthValid: boolean = checkStrength(pin.strength, `${pinPath}.strength`, state.issues);

    if (pin.name !== undefined) {
        checkPinName(pin.name, `${pinPath}.name`, state);
    }

    if (!isValidKey(pin.key) || parsed === null || !strengthValid) {
        return null;
    }

    return { index: index, key: pin.key, parsed: parsed, strength: resolveStrength(pin.strength) };
}

function checkPinName(name: string, path: string, state: ValidationState): void {
    if (!NAME_PATTERN.test(name)) {
        state.issues.push({ path: path, code: 'invalid-name', message: NAME_MESSAGE });
    }

    if (state.colorNames.has(name)) {
        state.issues.push({ path: path, code: 'name-conflict', message: `"${name}" is already a color name` });
    } else if (state.pinNames.has(name)) {
        state.issues.push({ path: path, code: 'name-conflict', message: `"${name}" is already used by another pin` });
    } else {
        state.pinNames.add(name);
    }
}

function checkStrength(strength: Pin['strength'], path: string, issues: PaletteIssue[]): boolean {
    if (strength === undefined) {
        return true;
    }

    if (typeof strength === 'number') {
        if (isUnit(strength)) {
            return true;
        }

        issues.push({ path: path, code: 'invalid-strength', message: STRENGTH_MESSAGE });

        return false;
    }

    const lValid: boolean = isUnit(strength.l);
    const cValid: boolean = isUnit(strength.c);

    if (!lValid) {
        issues.push({ path: `${path}.l`, code: 'invalid-strength', message: STRENGTH_MESSAGE });
    }

    if (!cValid) {
        issues.push({ path: `${path}.c`, code: 'invalid-strength', message: STRENGTH_MESSAGE });
    }

    return lValid && cValid;
}

function checkLightnessOrder(colorPath: string, usable: readonly UsablePin[], issues: PaletteIssue[]): void {
    const nails: UsablePin[] = usable
        .filter((pin: UsablePin): boolean => pin.strength.l === 1)
        .sort((a: UsablePin, b: UsablePin): number => a.key - b.key);

    for (let i: number = 1; i < nails.length; i++) {
        const previous: UsablePin = nails[i - 1];
        const current: UsablePin = nails[i];

        if (current.parsed.l >= previous.parsed.l) {
            issues.push({
                path: `${colorPath}.pins[${current.index}]`,
                code: 'lightness-order',
                message: `Must be darker than the pin at key ${previous.key}`,
            });
        }
    }
}

function hasHuePin(pins: readonly Pin[]): boolean {
    for (const pin of pins) {
        const parsed: ParsedColor | null = parseColor(pin.color);

        if (parsed !== null && parsed.h !== null && parsed.c >= ACHROMATIC_CHROMA) {
            return true;
        }
    }

    return false;
}

function isValidKey(key: number): boolean {
    return Number.isInteger(key) && key >= MIN_KEY && key <= MAX_KEY;
}

function isValidHue(hue: number): boolean {
    return Number.isFinite(hue) && hue >= 0 && hue < 360;
}

function isUnit(value: number): boolean {
    return Number.isFinite(value) && value >= 0 && value <= 1;
}
