<template>
    <UContextMenu :items="menuItems">
        <div class="flex flex-col gap-2" @contextmenu.capture="onContextMenu">
            <div v-for="row in rows" :key="row.name" class="flex flex-col gap-1">
                <div
                    class="flex items-center gap-2 rounded-lg border border-default bg-elevated/40 px-2 py-1.5"
                    :data-row="row.name"
                >
                    <span
                        class="size-2.5 shrink-0 rounded-full ring-1 ring-default ring-inset"
                        :style="{ backgroundColor: row.swatch }"
                    />
                    <span class="w-16 shrink-0 truncate font-mono text-xs text-toned">{{ row.name }}</span>
                    <USelect
                        :model-value="row.group"
                        :items="GROUP_ITEMS"
                        size="xs"
                        class="w-28"
                        @update:model-value="onGroupChange(row.name, $event)"
                    />
                    <UInputNumber
                        :model-value="row.hue"
                        :min="HUE_MIN"
                        :max="HUE_MAX"
                        :step="1"
                        size="xs"
                        placeholder="auto"
                        class="w-24"
                        @update:model-value="onHueChange(row.name, $event)"
                    />
                    <span class="min-w-0 flex-1 truncate text-[11px] text-dimmed">{{ row.pinCount }} pins</span>
                    <UButton
                        square
                        icon="i-material-symbols:delete-outline"
                        color="error"
                        variant="ghost"
                        size="xs"
                        :aria-label="`Remove ${row.name}`"
                        @click="onRemove(row.name)"
                    />
                </div>
                <p v-if="rowErrors[row.name] !== undefined" class="px-2 text-xs text-error">
                    {{ rowErrors[row.name] }}
                </p>
            </div>

            <form
                class="flex flex-col gap-1"
                @submit.prevent="onAdd"
            >
                <div class="flex items-center gap-2 rounded-lg border border-dashed border-default px-2 py-1.5">
                    <UInput
                        v-model="newName"
                        size="xs"
                        placeholder="name"
                        autocomplete="off"
                        class="min-w-0 flex-1 font-mono"
                    />
                    <USelect
                        :model-value="newGroup"
                        :items="GROUP_ITEMS"
                        size="xs"
                        class="w-28"
                        @update:model-value="onNewGroupChange"
                    />
                    <UInputNumber
                        :model-value="newHue"
                        :min="HUE_MIN"
                        :max="HUE_MAX"
                        :step="1"
                        size="xs"
                        placeholder="auto"
                        class="w-24"
                        @update:model-value="onNewHueChange"
                    />
                    <UButton
                        type="submit"
                        square
                        icon="i-material-symbols:add"
                        aria-label="Add"
                        size="xs"
                    />
                </div>
                <p v-if="formError !== null" class="px-2 text-xs text-error">
                    {{ formError }}
                </p>
            </form>
        </div>
    </UContextMenu>
</template>


<script setup lang="ts">
import type { ContextMenuItem } from '@nuxt/ui';
import type { ColorConfig, ColorGroup, PaletteConfig, PaletteIssue, PaletteToken } from 'vcopalette';
import type { ComputedRef, Ref } from 'vue';
import { computed, ref } from 'vue';
import { usePlayground } from '~/composables/usePlayground';


interface ColorRow {
    name: string;
    group: ColorGroup;
    hue: number | null;
    pinCount: number;
    swatch: string;
}


const NAME_PATTERN: RegExp = /^[a-z][a-z0-9-]*$/;
const DEFAULT_NEW_HUE: number = 200;
const HUE_MIN: number = 0;
const HUE_MAX: number = 359;
const SWATCH_KEY: number = 500;
const GROUP_ITEMS: ColorGroup[] = ['chromatic', 'neutral'];

const { config, palette, tryUpdate, removeColor } = usePlayground();

const rowErrors: Ref<Record<string, string | undefined>> = ref<Record<string, string | undefined>>({});
const newName: Ref<string> = ref<string>('');
const newGroup: Ref<ColorGroup> = ref<ColorGroup>('chromatic');
const newHue: Ref<number | null> = ref<number | null>(DEFAULT_NEW_HUE);
const formError: Ref<string | null> = ref<string | null>(null);
const contextColor: Ref<string | null> = ref<string | null>(null);

const rows: ComputedRef<ColorRow[]> = computed<ColorRow[]>((): ColorRow[] => {
    return Object.entries(config.value.colors)
        .map(([name, colorConfig]: [string, ColorConfig]): ColorRow => ({
            name: name,
            group: colorConfig.group ?? 'chromatic',
            hue: colorConfig.hue ?? null,
            pinCount: (colorConfig.pins ?? []).length,
            swatch: readSwatch(name),
        }));
});

const menuItems: ComputedRef<ContextMenuItem[]> = computed<ContextMenuItem[]>((): ContextMenuItem[] => {
    const name: string | null = contextColor.value;

    if (name === null) {
        return [{ label: 'No actions here', disabled: true }];
    }

    return [
        {
            label: `Remove color "${name}"`,
            icon: 'i-material-symbols:delete-outline',
            color: 'error',
            onSelect: (): void => {
                onRemove(name);
            },
        },
    ];
});


function readSwatch(name: string): string {
    const scale: PaletteToken[] = palette.value[name] ?? [];
    const shade: PaletteToken | undefined = scale.find((token: PaletteToken): boolean => token.key === SWATCH_KEY);

    return shade?.hex ?? scale[0]?.hex ?? 'transparent';
}


function isColorGroup(value: string | undefined): value is ColorGroup {
    return value === 'chromatic' || value === 'neutral';
}


function readHue(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    return Number(value);
}


/** Returns true when the change was applied. */
function reportIssues(name: string, issues: PaletteIssue[]): boolean {
    const first: PaletteIssue | undefined = issues[0];

    rowErrors.value[name] = first?.message;

    return first === undefined;
}


function onContextMenu(event: MouseEvent): void {
    contextColor.value = readContextColor(event.target);
}


function readContextColor(target: EventTarget | null): string | null {
    if (!(target instanceof Element)) {
        return null;
    }

    const row: Element | null = target.closest('[data-row]');

    return row?.getAttribute('data-row') ?? null;
}


function onGroupChange(name: string, value: string | undefined): void {
    if (!isColorGroup(value)) {
        return;
    }

    const group: ColorGroup = value;
    const issues: PaletteIssue[] = tryUpdate((draft: PaletteConfig): void => {
        const colorConfig: ColorConfig | undefined = draft.colors[name];

        if (colorConfig === undefined) {
            return;
        }

        colorConfig.group = group;
    });

    reportIssues(name, issues);
}


function onHueChange(name: string, value: number | string | null | undefined): void {
    const hue: number | null = readHue(value);
    const issues: PaletteIssue[] = tryUpdate((draft: PaletteConfig): void => {
        const colorConfig: ColorConfig | undefined = draft.colors[name];

        if (colorConfig === undefined) {
            return;
        }

        if (hue === null) {
            delete colorConfig.hue;
        } else {
            colorConfig.hue = hue;
        }
    });

    reportIssues(name, issues);
}


function onRemove(name: string): void {
    removeColor(name);
    delete rowErrors.value[name];
}


function onNewGroupChange(value: string | undefined): void {
    if (isColorGroup(value)) {
        newGroup.value = value;
    }
}


function onNewHueChange(value: number | string | null | undefined): void {
    newHue.value = readHue(value);
}


function onAdd(): void {
    const name: string = newName.value.trim();

    if (!NAME_PATTERN.test(name)) {
        formError.value = 'Use lowercase letters, digits and dashes, starting with a letter';

        return;
    }

    if (Object.hasOwn(config.value.colors, name)) {
        formError.value = `Color "${name}" already exists`;

        return;
    }

    const colorConfig: ColorConfig = { group: newGroup.value };
    const hue: number | null = newHue.value;

    if (hue !== null) {
        colorConfig.hue = hue;
    }

    const issues: PaletteIssue[] = tryUpdate((draft: PaletteConfig): void => {
        draft.colors[name] = colorConfig;
    });
    const first: PaletteIssue | undefined = issues[0];

    if (first !== undefined) {
        formError.value = first.message;

        return;
    }

    formError.value = null;
    newName.value = '';
    newGroup.value = 'chromatic';
    newHue.value = DEFAULT_NEW_HUE;
}
</script>
