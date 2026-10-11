<template>
    <UContextMenu :items="menuItems">
        <div class="flex flex-col gap-2" @contextmenu.capture="onContextMenu">
            <p v-if="groups.length === 0" class="px-1 text-xs text-muted">
                No pins yet. Right-click a palette cell to add one.
            </p>

            <section
                v-for="group in groups"
                :key="group.color"
                class="flex flex-col gap-px rounded-lg border border-default bg-elevated/40 p-1"
            >
                <header class="flex items-center gap-2 px-1.5 py-0.5" :data-row="group.color">
                    <span
                        class="size-2.5 shrink-0 rounded-full ring-1 ring-default ring-inset"
                        :style="{ backgroundColor: group.swatch }"
                    />
                    <h3 class="min-w-0 flex-1 truncate text-xs font-medium text-highlighted">
                        {{ group.color }}
                    </h3>
                    <span class="shrink-0 text-[11px] text-dimmed">{{ group.rows.length }}</span>
                </header>

                <button
                    v-for="row in group.rows"
                    :key="`${group.color}-${row.key}`"
                    type="button"
                    class="flex h-6 cursor-pointer items-center gap-2 rounded-md px-1.5 text-left hover:bg-elevated"
                    :class="isSelected(group.color, row.key) ? SELECTED_ROW_CLASS : ''"
                    :data-color="group.color"
                    :data-key="row.key"
                    @click="select(group.color, row.key)"
                >
                    <span
                        class="size-3.5 shrink-0 rounded-[3px] ring-1 ring-default ring-inset"
                        :style="{ backgroundColor: row.hex }"
                    />
                    <span class="w-9 shrink-0 font-mono text-[11px] text-muted tabular-nums">{{ row.key }}</span>
                    <span
                        class="min-w-0 flex-1 truncate text-xs"
                        :class="row.name === undefined ? 'text-dimmed italic' : ''"
                    >
                        {{ row.name ?? 'unnamed' }}
                    </span>
                    <UIcon :name="row.nail ? NAIL_ICON : MAGNET_ICON" class="size-3.5 shrink-0 text-muted" />
                    <span v-if="!row.nail" class="shrink-0 font-mono text-[10px] text-muted">{{ row.label }}</span>
                </button>
            </section>
        </div>
    </UContextMenu>
</template>


<script setup lang="ts">
import type { ContextMenuItem } from '@nuxt/ui';
import type { ColorConfig, Palette, PaletteIssue, PaletteToken, Pin, Strength } from 'vcopalette';
import type { ComputedRef, Ref } from 'vue';
import type { PinRef } from '~/composables/usePlayground';
import { computed, ref } from 'vue';
import { usePlayground } from '~/composables/usePlayground';
import { readStrength } from '~/utils/strength';


interface PinRow {
    key: number;
    hex: string;
    name: string | undefined;
    nail: boolean;
    label: string;
}

interface PinGroup {
    color: string;
    swatch: string;
    rows: PinRow[];
}

interface PinTarget {
    kind: 'pin';
    color: string;
    key: number;
}

interface RowTarget {
    kind: 'row';
    color: string;
}

type ContextTarget = PinTarget | RowTarget;


const NAIL_ICON: string = 'i-material-symbols:keep';
const MAGNET_ICON: string = 'i-material-symbols:keep-outline';
const SELECTED_ROW_CLASS: string = 'bg-accented text-highlighted shadow-[inset_2px_0_0_var(--ui-primary)]';
const SWATCH_KEY: number = 500;
const PERCENT: number = 100;
const MAGNET_STRENGTH: number = 0.5;
const NAIL_STRENGTH: number = 1;

const { config, palette, selected, findPin, updatePin, removePin, removeColor } = usePlayground();
const toast = useToast();

const contextTarget: Ref<ContextTarget | null> = ref<ContextTarget | null>(null);

const groups: ComputedRef<PinGroup[]> = computed<PinGroup[]>((): PinGroup[] => {
    return Object.entries(config.value.colors)
        .map(([color, colorConfig]: [string, ColorConfig]): PinGroup => ({
            color: color,
            swatch: readSwatch(color, palette.value),
            rows: (colorConfig.pins ?? [])
                .map((pin: Pin): PinRow => toRow(pin))
                .sort((first: PinRow, second: PinRow): number => first.key - second.key),
        }))
        .filter((group: PinGroup): boolean => group.rows.length > 0);
});

const menuItems: ComputedRef<ContextMenuItem[][]> = computed<ContextMenuItem[][]>((): ContextMenuItem[][] => {
    const target: ContextTarget | null = contextTarget.value;

    if (target === null) {
        return [[{ label: 'No actions here', disabled: true }]];
    }

    if (target.kind === 'row') {
        return [[buildRowItem(target.color)]];
    }

    return buildPinItems(target.color, target.key);
});


function readSwatch(color: string, source: Palette): string {
    const scale: PaletteToken[] = source[color] ?? [];
    const shade: PaletteToken | undefined = scale.find((token: PaletteToken): boolean => token.key === SWATCH_KEY);

    return shade?.hex ?? scale[0]?.hex ?? 'transparent';
}


function toRow(pin: Pin): PinRow {
    const strength: Strength = readStrength(pin.strength);
    const nail: boolean = strength.l === NAIL_STRENGTH && strength.c === NAIL_STRENGTH;
    const lightness: number = Math.round(strength.l * PERCENT);
    const chroma: number = Math.round(strength.c * PERCENT);
    const label: string = lightness === chroma ? `${lightness}%` : `L ${lightness} C ${chroma}`;

    return {
        key: pin.key,
        hex: pin.color,
        name: pin.name,
        nail: nail,
        label: label,
    };
}


function isSelected(color: string, key: number): boolean {
    const current: PinRef | null = selected.value;

    return current !== null && current.color === color && current.key === key;
}


function select(color: string, key: number): void {
    selected.value = { color: color, key: key };
}


function onContextMenu(event: MouseEvent): void {
    contextTarget.value = readContextTarget(event.target);
}


function readContextTarget(target: EventTarget | null): ContextTarget | null {
    if (!(target instanceof Element)) {
        return null;
    }

    const keyed: Element | null = target.closest('[data-key]');

    if (keyed !== null) {
        const keyText: string | null = keyed.getAttribute('data-key');
        const key: number = Number.parseInt(keyText ?? '', 10);
        const color: string | null = keyed.getAttribute('data-color');

        if (Number.isNaN(key) || color === null) {
            return null;
        }

        return { kind: 'pin', color: color, key: key };
    }

    const rowed: Element | null = target.closest('[data-row]');

    if (rowed === null) {
        return null;
    }

    const rowColor: string | null = rowed.getAttribute('data-row');

    return rowColor === null ? null : { kind: 'row', color: rowColor };
}


function buildRowItem(color: string): ContextMenuItem {
    return {
        label: `Remove color "${color}"`,
        icon: 'i-material-symbols:delete-outline',
        color: 'error',
        onSelect: (): void => {
            removeColor(color);
        },
    };
}


function buildPinItems(color: string, key: number): ContextMenuItem[][] {
    const pinRef: PinRef = { color: color, key: key };
    const pin: Pin | undefined = findPin(pinRef);

    if (pin === undefined) {
        return [[{ label: 'No actions here', disabled: true }]];
    }

    const strength: Strength = readStrength(pin.strength);
    const nail: boolean = strength.l === NAIL_STRENGTH && strength.c === NAIL_STRENGTH;
    const toggle: ContextMenuItem = nail
        ? {
            label: 'Make magnet',
            icon: MAGNET_ICON,
            onSelect: (): void => {
                applyResult(updatePin(pinRef, { strength: MAGNET_STRENGTH }));
            },
        }
        : {
            label: 'Make nail',
            icon: NAIL_ICON,
            onSelect: (): void => {
                applyResult(updatePin(pinRef, { strength: NAIL_STRENGTH }));
            },
        };

    return [
        [
            {
                label: 'Edit pin',
                icon: 'i-material-symbols:edit-outline',
                onSelect: (): void => {
                    select(color, key);
                },
            },
            toggle,
        ],
        [
            {
                label: 'Remove pin',
                icon: 'i-material-symbols:delete-outline',
                color: 'error',
                onSelect: (): void => {
                    removePin(pinRef);
                },
            },
        ],
    ];
}


function applyResult(issues: PaletteIssue[]): void {
    const first: PaletteIssue | undefined = issues[0];

    if (first !== undefined) {
        toast.add({ title: 'Not applied', description: first.message, color: 'error' });
    }
}
</script>
