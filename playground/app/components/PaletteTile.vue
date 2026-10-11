<template>
    <section class="flex min-w-0 flex-col gap-2">
        <div class="flex items-center justify-between gap-4">
            <h2 class="text-sm font-medium text-highlighted">
                Palette
            </h2>
            <UTabs v-model="metric" :items="METRICS" :content="false" size="xs" />
        </div>

        <UContextMenu :items="menuItems">
            <div
                class="grid w-max items-center gap-0.5"
                :style="{ gridTemplateColumns }"
                @contextmenu.capture="onContextMenu"
            >
                <span />
                <span
                    v-for="key in columns"
                    :key="key"
                    class="pb-0.5 text-center font-mono text-[10px] text-dimmed"
                    :data-key="key"
                >
                    {{ key }}
                </span>

                <template v-for="row in rows" :key="row.color">
                    <span class="w-16 truncate pr-1 text-xs text-toned" :title="row.color" :data-row="row.color">
                        {{ row.color }}
                    </span>
                    <UTooltip v-for="cell in row.cells" :key="cell.key" :text="cell.tooltip">
                        <button
                            type="button"
                            class="relative h-5 w-[30px] cursor-pointer rounded-sm font-mono text-[9px] leading-none transition-transform hover:z-10 hover:scale-125"
                            :class="cellClass(cell)"
                            :style="cell.token !== undefined ? { backgroundColor: cell.token.hex } : undefined"
                            :data-color="cell.color"
                            :data-key="cell.key"
                            :aria-label="cell.tooltip"
                            @click="onCellClick(cell)"
                        >
                            {{ cell.metric }}
                        </button>
                    </UTooltip>
                </template>
            </div>
        </UContextMenu>

        <AddKeyModal v-model:open="addKeyOpen" />
    </section>
</template>


<script setup lang="ts">
import type { ContextMenuItem, TabsItem } from '@nuxt/ui';
import type { PaletteConfig, PaletteIssue, PaletteToken } from 'vcopalette';
import type { ComputedRef, Ref } from 'vue';
import type { PinRef } from '~/composables/usePlayground';
import { DEFAULT_KEYS } from 'vcopalette';
import { computed, ref } from 'vue';
import { usePlayground } from '~/composables/usePlayground';
import { formatOklch } from '~/utils/oklch';


type Metric = 'none' | 'l' | 'c' | 'h';

interface TileCell {
    color: string;
    key: number;
    token: PaletteToken | undefined;
    pinned: boolean;
    nail: boolean;
    selected: boolean;
    metric: string;
    tooltip: string;
}

interface TileRow {
    color: string;
    cells: TileCell[];
}

interface CellTarget {
    kind: 'cell';
    color: string;
    key: number;
}

interface ColumnTarget {
    kind: 'column';
    key: number;
}

interface RowTarget {
    kind: 'row';
    color: string;
}

type ContextTarget = CellTarget | ColumnTarget | RowTarget;


const LABEL_WIDTH: number = 64;
const CELL_WIDTH: number = 30;
/** OKLCH L above which cell text switches to dark. */
const TEXT_FLIP_L: number = 0.62;

const METRICS: TabsItem[] = [
    { label: '—', value: 'none' },
    { label: 'L×100', value: 'l' },
    { label: 'C×1000', value: 'c' },
    { label: 'H°', value: 'h' },
];

const { config, palette, selected, addPin, updatePin, removePin, removeColor, removeKey } = usePlayground();
const toast = useToast();

const metric: Ref<Metric> = ref<Metric>('none');
const contextTarget: Ref<ContextTarget | null> = ref<ContextTarget | null>(null);
const addKeyOpen: Ref<boolean> = ref<boolean>(false);

const columns: ComputedRef<number[]> = computed<number[]>((): number[] => {
    const keys: Set<number> = new Set<number>();

    for (const tokens of Object.values(palette.value)) {
        for (const token of tokens) {
            keys.add(token.key);
        }
    }

    return [...keys].sort((first: number, second: number): number => first - second);
});

const gridTemplateColumns: ComputedRef<string> = computed<string>((): string => {
    if (columns.value.length === 0) {
        return `${LABEL_WIDTH}px`;
    }

    return `${LABEL_WIDTH}px repeat(${columns.value.length}, ${CELL_WIDTH}px)`;
});

const rows: ComputedRef<TileRow[]> = computed<TileRow[]>((): TileRow[] => {
    return Object.entries(palette.value).map(([color, tokens]: [string, PaletteToken[]]): TileRow => ({
        color: color,
        cells: columns.value.map((key: number): TileCell => buildCell(color, key, tokens)),
    }));
});

const menuItems: ComputedRef<ContextMenuItem[][]> = computed<ContextMenuItem[][]>((): ContextMenuItem[][] => {
    const target: ContextTarget | null = contextTarget.value;

    if (target === null) {
        return [[{ label: 'No actions here', disabled: true }]];
    }

    if (target.kind === 'row') {
        return [[buildRowItem(target.color)]];
    }

    if (target.kind === 'column') {
        return buildColumnItems(target.key);
    }

    return buildCellItems(target.color, target.key);
});


function buildCell(color: string, key: number, tokens: PaletteToken[]): TileCell {
    const token: PaletteToken | undefined = tokens.find((candidate: PaletteToken): boolean => candidate.key === key);
    const current: PinRef | null = selected.value;
    const isSelected: boolean = current !== null && current.color === color && current.key === key;

    if (token === undefined) {
        return {
            color: color,
            key: key,
            token: undefined,
            pinned: false,
            nail: false,
            selected: false,
            metric: '',
            tooltip: `${color}-${key}  not emitted  ·  right-click to pin`,
        };
    }

    return {
        color: color,
        key: key,
        token: token,
        pinned: token.pin !== undefined,
        nail: token.pin !== undefined && token.pin.strength.l === 1 && token.pin.strength.c === 1,
        selected: isSelected,
        metric: metricText(token),
        tooltip: `${color}-${key}  ${token.hex.toUpperCase()}  ·  ${formatOklch(token.oklch)}`,
    };
}


function metricText(token: PaletteToken): string {
    switch (metric.value) {
        case 'l': {
            return String(Math.round(token.oklch.l * 100));
        }
        case 'c': {
            return String(Math.round(token.oklch.c * 1000));
        }
        case 'h': {
            return String(Math.round(token.oklch.h));
        }
        default: {
            return '';
        }
    }
}


function cellClass(cell: TileCell): string[] {
    if (cell.token === undefined) {
        return ['border border-dashed border-default'];
    }

    const classes: string[] = [cell.token.oklch.l > TEXT_FLIP_L ? 'text-black/70' : 'text-white/80'];

    if (cell.pinned) {
        classes.push('outline-2 outline-offset-1 outline-(--ui-text-highlighted)');

        if (!cell.nail) {
            classes.push('outline-dashed');
        }
    }

    if (cell.selected) {
        classes.push('z-10 scale-110 ring-2 ring-(--ui-primary)');
    }

    return classes;
}


function onCellClick(cell: TileCell): void {
    if (cell.pinned) {
        selected.value = { color: cell.color, key: cell.key };
    } else {
        selected.value = null;
    }
}


function onContextMenu(event: MouseEvent): void {
    contextTarget.value = readContextTarget(event.target);
}


function readContextTarget(target: EventTarget | null): ContextTarget | null {
    if (!(target instanceof Element)) {
        return null;
    }

    const rowed: Element | null = target.closest('[data-row]');

    if (rowed !== null) {
        const rowColor: string | null = rowed.getAttribute('data-row');

        return rowColor === null ? null : { kind: 'row', color: rowColor };
    }

    const keyed: Element | null = target.closest('[data-key]');

    if (keyed === null) {
        return null;
    }

    const keyText: string | null = keyed.getAttribute('data-key');
    const key: number = Number.parseInt(keyText ?? '', 10);

    if (Number.isNaN(key)) {
        return null;
    }

    const color: string | null = keyed.getAttribute('data-color');

    if (color === null) {
        return { kind: 'column', key: key };
    }

    return { kind: 'cell', color: color, key: key };
}


function isRemovableKey(key: number): boolean {
    const keys: number[] | undefined = config.value.keys;

    return !DEFAULT_KEYS.includes(key) && keys !== undefined && keys.includes(key);
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


function buildColumnItems(key: number): ContextMenuItem[][] {
    const groups: ContextMenuItem[][] = [[
        {
            label: 'Add key…',
            icon: 'i-material-symbols:add',
            onSelect: (): void => {
                addKeyOpen.value = true;
            },
        },
    ]];

    if (isRemovableKey(key)) {
        groups.push([{
            label: `Remove key ${key}`,
            icon: 'i-material-symbols:delete-outline',
            color: 'error',
            onSelect: (): void => {
                applyResult(removeKey(key));
            },
        }]);
    }

    return groups;
}


function buildCellItems(color: string, key: number): ContextMenuItem[][] {
    const pinRef: PinRef = { color: color, key: key };
    const token: PaletteToken | undefined = palette.value[color]?.find((candidate: PaletteToken): boolean => candidate.key === key);
    const items: ContextMenuItem[] = [];
    const groups: ContextMenuItem[][] = [items];

    if (token?.pin !== undefined) {
        const nail: boolean = token.pin.strength.l === 1 && token.pin.strength.c === 1;

        items.push({
            label: 'Edit pin',
            icon: 'i-material-symbols:edit-outline',
            onSelect: (): void => {
                selected.value = pinRef;
            },
        });

        if (nail) {
            items.push({
                label: 'Make magnet',
                icon: 'i-material-symbols:keep-outline',
                onSelect: (): void => {
                    applyResult(updatePin(pinRef, { strength: 0.5 }));
                },
            });
        } else {
            items.push({
                label: 'Make nail',
                icon: 'i-material-symbols:keep',
                onSelect: (): void => {
                    applyResult(updatePin(pinRef, { strength: 1 }));
                },
            });
        }
    } else {
        items.push({
            label: 'Nail here',
            icon: 'i-material-symbols:keep',
            onSelect: (): void => {
                applyResult(addPin(color, key, 1));
            },
        });
        items.push({
            label: 'Magnet here (50%)',
            icon: 'i-material-symbols:keep-outline',
            onSelect: (): void => {
                applyResult(addPin(color, key, 0.5));
            },
        });
    }

    if (token !== undefined) {
        const hex: string = token.hex;

        items.push({
            label: 'Copy hex',
            icon: 'i-material-symbols:content-copy-outline',
            onSelect: (): void => {
                copyHex(hex);
            },
        });
    }

    if (token?.pin !== undefined) {
        groups.push([{
            label: 'Remove pin',
            icon: 'i-material-symbols:delete-outline',
            color: 'error',
            onSelect: (): void => {
                removePin(pinRef);
            },
        }]);
    }

    return groups;
}


function applyResult(issues: PaletteIssue[]): void {
    const first: PaletteIssue | undefined = issues[0];

    if (first !== undefined) {
        toast.add({ title: 'Not applied', description: first.message, color: 'error' });
    }
}


function copyHex(hex: string): void {
    navigator.clipboard.writeText(hex).then((): void => {
        toast.add({ title: 'Copied', description: hex, color: 'success', duration: 1500 });
    });
}
</script>
