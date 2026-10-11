<template>
    <section class="flex min-h-24 flex-col justify-center gap-3 rounded-lg border border-default bg-elevated/40 p-3">
        <template v-if="view !== null">
            <header class="flex items-center justify-between gap-2">
                <div class="flex min-w-0 items-baseline gap-2">
                    <span class="shrink-0 font-mono text-xs text-muted">{{ selectionKey }}</span>
                    <span
                        class="min-w-0 truncate text-sm font-medium text-highlighted"
                        :class="pinName === undefined ? 'text-dimmed italic' : ''"
                    >
                        {{ pinName ?? 'unnamed' }}
                    </span>
                </div>
                <UButton
                    label="Remove"
                    icon="i-material-symbols:delete-outline"
                    color="error"
                    variant="ghost"
                    size="xs"
                    @click="onRemove"
                />
            </header>

            <div class="grid grid-cols-[auto_1fr] gap-4">
                <div class="w-[200px]">
                    <ColorField
                        :key="selectionKey"
                        :model-value="view.pin.color"
                        @update:model-value="onColorChange"
                    />
                </div>

                <div class="flex min-w-0 flex-col gap-2">
                    <div class="grid grid-cols-[72px_1fr] items-center gap-2">
                        <span class="text-xs text-muted">Name</span>
                        <UInput
                            v-model="nameText"
                            size="xs"
                            placeholder="token name"
                            autocomplete="off"
                            class="w-full"
                            @change="onNameCommit"
                        />
                    </div>

                    <div class="grid grid-cols-[72px_1fr] items-center gap-2">
                        <span class="text-xs text-muted">Key</span>
                        <UInputNumber
                            v-model="keyValue"
                            :min="MIN_KEY"
                            :max="MAX_KEY"
                            :step="KEY_STEP"
                            size="xs"
                            class="w-32"
                            @change="onKeyCommit"
                        />
                    </div>

                    <div v-if="linked" class="grid grid-cols-[72px_1fr] items-center gap-2">
                        <span class="text-xs text-muted">Strength</span>
                        <div class="flex items-center gap-2">
                            <USlider
                                :model-value="lightness"
                                :min="0"
                                :max="PERCENT"
                                :step="1"
                                size="xs"
                                class="min-w-0 flex-1"
                                @update:model-value="onLinkedSlide"
                            />
                            <span class="w-9 text-right font-mono text-[11px] text-muted">{{ lightness }}%</span>
                            <UTooltip text="Link lightness and chroma">
                                <UButton
                                    square
                                    icon="i-material-symbols:link"
                                    color="neutral"
                                    variant="ghost"
                                    size="xs"
                                    aria-label="Unlink lightness and chroma"
                                    @click="onToggleLinked"
                                />
                            </UTooltip>
                        </div>
                    </div>

                    <template v-else>
                        <div class="grid grid-cols-[72px_1fr] items-center gap-2">
                            <span class="text-xs text-muted">Lightness</span>
                            <div class="flex items-center gap-2">
                                <USlider
                                    :model-value="lightness"
                                    :min="0"
                                    :max="PERCENT"
                                    :step="1"
                                    size="xs"
                                    class="min-w-0 flex-1"
                                    @update:model-value="onLightnessSlide"
                                />
                                <span class="w-9 text-right font-mono text-[11px] text-muted">{{ lightness }}%</span>
                                <UTooltip text="Link lightness and chroma">
                                    <UButton
                                        square
                                        icon="i-material-symbols:link-off"
                                        color="neutral"
                                        variant="ghost"
                                        size="xs"
                                        aria-label="Link lightness and chroma"
                                        @click="onToggleLinked"
                                    />
                                </UTooltip>
                            </div>
                        </div>

                        <div class="grid grid-cols-[72px_1fr] items-center gap-2">
                            <span class="text-xs text-muted">Chroma</span>
                            <div class="flex items-center gap-2">
                                <USlider
                                    :model-value="chroma"
                                    :min="0"
                                    :max="PERCENT"
                                    :step="1"
                                    size="xs"
                                    class="min-w-0 flex-1"
                                    @update:model-value="onChromaSlide"
                                />
                                <span class="w-9 text-right font-mono text-[11px] text-muted">{{ chroma }}%</span>
                                <span class="size-6 shrink-0" aria-hidden="true" />
                            </div>
                        </div>
                    </template>

                    <div class="grid grid-cols-[72px_1fr] items-center gap-2">
                        <span class="text-xs text-muted">Mode</span>
                        <UFieldGroup size="xs">
                            <UButton
                                label="Nail"
                                icon="i-material-symbols:keep"
                                color="neutral"
                                :variant="isNail ? 'solid' : 'outline'"
                                size="xs"
                                @click="onNail"
                            />
                            <UButton
                                label="Magnet"
                                icon="i-material-symbols:keep-outline"
                                color="neutral"
                                :variant="isNail ? 'outline' : 'solid'"
                                size="xs"
                                @click="onMagnet"
                            />
                        </UFieldGroup>
                    </div>

                    <p v-if="errorText !== null" class="text-xs text-error">
                        {{ errorText }}
                    </p>
                </div>
            </div>
        </template>

        <p v-else class="text-sm text-muted">
            Select a pin in the list, or right-click a palette cell to add one.
        </p>
    </section>
</template>


<script setup lang="ts">
import type { PaletteIssue, Pin, Strength } from 'vcopalette';
import type { ComputedRef, Ref } from 'vue';
import type { PinRef } from '~/composables/usePlayground';
import { computed, ref, watch } from 'vue';
import { usePlayground } from '~/composables/usePlayground';
import { readStrength } from '~/utils/strength';


interface PinView {
    target: PinRef;
    pin: Pin;
}


const MIN_KEY: number = 0;
const MAX_KEY: number = 1000;
const KEY_STEP: number = 5;
const PERCENT: number = 100;

const { selected, findPin, updatePin, removePin } = usePlayground();

const view: ComputedRef<PinView | null> = computed<PinView | null>((): PinView | null => {
    const current: PinRef | null = selected.value;

    if (current === null) {
        return null;
    }

    const pin: Pin | undefined = findPin(current);

    if (pin === undefined) {
        return null;
    }

    return { target: current, pin: pin };
});

const selectionKey: ComputedRef<string> = computed<string>((): string => {
    const current: PinView | null = view.value;

    return current === null ? '' : `${current.target.color}-${current.target.key}`;
});

const pinName: ComputedRef<string | undefined> = computed<string | undefined>((): string | undefined => {
    return view.value?.pin.name;
});

const nameText: Ref<string> = ref<string>('');
const keyValue: Ref<number | null> = ref<number | null>(null);
const lightness: Ref<number> = ref<number>(PERCENT);
const chroma: Ref<number> = ref<number>(PERCENT);
const linked: Ref<boolean> = ref<boolean>(true);
const errorText: Ref<string | null> = ref<string | null>(null);

const isNail: ComputedRef<boolean> = computed<boolean>((): boolean => lightness.value === PERCENT && chroma.value === PERCENT);


syncFromPin();
linked.value = lightness.value === chroma.value;

watch(selectionKey, (): void => {
    syncFromPin();
    linked.value = lightness.value === chroma.value;
});

watch(view, (): void => {
    syncFromPin();
});


function toPercent(value: number): number {
    return Math.round(value * PERCENT);
}


function readSlider(value: number | number[] | undefined): number {
    if (typeof value === 'number') {
        return value;
    }

    return value?.[0] ?? 0;
}


/** Re-reads every input from the current pin, so a rejected edit snaps back. */
function syncFromPin(): void {
    const current: PinView | null = view.value;

    if (current === null) {
        return;
    }

    const strength: Strength = readStrength(current.pin.strength);

    nameText.value = current.pin.name ?? '';
    keyValue.value = current.pin.key;
    lightness.value = toPercent(strength.l);
    chroma.value = toPercent(strength.c);
}


function apply(patch: Partial<Pin>): void {
    const current: PinRef | null = selected.value;

    if (current === null) {
        return;
    }

    const issues: PaletteIssue[] = updatePin(current, patch);
    const first: PaletteIssue | undefined = issues[0];

    errorText.value = first === undefined ? null : first.message;
    syncFromPin();
}


function onToggleLinked(): void {
    linked.value = !linked.value;
}


function onColorChange(value: string): void {
    apply({ color: value });
}


function onNameCommit(): void {
    const trimmed: string = nameText.value.trim();

    apply({ name: trimmed === '' ? undefined : trimmed });
}


function onKeyCommit(): void {
    const next: number | null = keyValue.value;

    if (next === null) {
        errorText.value = `Enter a key from ${MIN_KEY} to ${MAX_KEY}`;
        syncFromPin();

        return;
    }

    apply({ key: next });
}


function onLinkedSlide(value: number | number[] | undefined): void {
    apply({ strength: readSlider(value) / PERCENT });
}


function onLightnessSlide(value: number | number[] | undefined): void {
    apply({
        strength: {
            l: readSlider(value) / PERCENT,
            c: chroma.value / PERCENT,
        },
    });
}


function onChromaSlide(value: number | number[] | undefined): void {
    apply({
        strength: {
            l: lightness.value / PERCENT,
            c: readSlider(value) / PERCENT,
        },
    });
}


function onNail(): void {
    apply({ strength: 1 });
}


function onMagnet(): void {
    apply({ strength: 0.5 });
}


function onRemove(): void {
    const current: PinView | null = view.value;

    if (current === null) {
        return;
    }

    removePin(current.target);
    errorText.value = null;
}
</script>
