<template>
    <div class="flex flex-col gap-2">
        <div @pointerdown.capture="onPointerDown">
            <UColorPicker :model-value="modelValue" size="sm" @update:model-value="onPick" />
        </div>
        <UInput
            v-model="text"
            size="xs"
            class="font-mono"
            autocomplete="off"
            @update:model-value="onType"
            @change="onCommit"
        />
        <p class="font-mono text-[10px] text-muted">
            {{ oklchText }}
        </p>
    </div>
</template>


<script setup lang="ts">
import type { OklchParts } from '~/utils/oklch';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { formatOklch, normalizeHex, readOklch } from '~/utils/oklch';


const modelValue = defineModel<string>({ required: true });

const SIX_DIGIT_HEX: RegExp = /^#?[0-9a-f]{6}$/i;
/** Must exceed UColorPicker's 50ms throttle so the final drag emit still lands. */
const PICKER_SETTLE_MS: number = 150;

const text = ref<string>(modelValue.value);

/**
 * UColorPicker re-derives its value from thumb positions (HSV, integer
 * percentages) after every external change and emits that lossy echo, e.g.
 * #6B7A99 -> #6C7A99. Only emits made while the user drags the picker count.
 */
let dragging: boolean = false;
let settleTimer: ReturnType<typeof setTimeout> | undefined;

const oklchText = computed<string>(() => {
    const parts: OklchParts | null = readOklch(modelValue.value);
    return parts === null ? '' : formatOklch(parts);
});


watch(modelValue, (value: string): void => {
    if (normalizeHex(text.value) !== normalizeHex(value)) {
        text.value = value;
    }
});


onBeforeUnmount((): void => {
    clearTimeout(settleTimer);
    window.removeEventListener('pointerup', onPointerUp);
});


function onPointerDown(): void {
    dragging = true;
    clearTimeout(settleTimer);
    window.addEventListener('pointerup', onPointerUp, { once: true });
}


function onPointerUp(): void {
    settleTimer = setTimeout((): void => {
        dragging = false;
    }, PICKER_SETTLE_MS);
}


function onPick(value: string | undefined): void {
    if (!dragging || value === undefined) {
        return;
    }
    const hex: string | null = normalizeHex(value);
    if (hex !== null) {
        modelValue.value = hex;
    }
}


/** Live-applies only complete 6-digit hex so a half-typed value never jumps to a 3-digit expansion. */
function onType(value: string | number): void {
    const raw: string = String(value).trim();
    if (!SIX_DIGIT_HEX.test(raw)) {
        return;
    }
    const hex: string | null = normalizeHex(raw.startsWith('#') ? raw : `#${raw}`);
    if (hex !== null) {
        modelValue.value = hex;
    }
}


/** On blur/Enter accepts any CSS colour (`oklch(...)`, `rebeccapurple`, ...), otherwise reverts. */
function onCommit(): void {
    const hex: string | null = normalizeHex(text.value);
    if (hex === null) {
        text.value = modelValue.value;
        return;
    }
    modelValue.value = hex;
    text.value = hex;
}
</script>
