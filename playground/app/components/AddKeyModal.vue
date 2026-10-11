<template>
    <UModal v-model:open="isOpen" title="Add key" description="A column for every color, at this key from 0 to 1000.">
        <template #body>
            <form class="flex flex-col gap-3" @submit.prevent="submit">
                <UInputNumber v-model="keyValue" :min="MIN_KEY" :max="MAX_KEY" :step="5" class="w-full" />
                <p v-if="errorText !== null" class="text-sm text-error">
                    {{ errorText }}
                </p>
                <div class="flex justify-end">
                    <UButton type="submit" label="Add" />
                </div>
            </form>
        </template>
    </UModal>
</template>


<script setup lang="ts">
import type { PaletteIssue } from 'vcopalette';
import type { ModelRef, Ref } from 'vue';
import { ref, watch } from 'vue';
import { usePlayground } from '~/composables/usePlayground';


const MIN_KEY: number = 0;
const MAX_KEY: number = 1000;

const isOpen: ModelRef<boolean> = defineModel<boolean>('open', { default: false });

const { addKey } = usePlayground();

const keyValue: Ref<number | null> = ref<number | null>(null);
const errorText: Ref<string | null> = ref<string | null>(null);


watch(isOpen, (next: boolean): void => {
    if (next) {
        keyValue.value = null;
        errorText.value = null;
    }
});


function submit(): void {
    const key: number | null = keyValue.value;

    if (key === null) {
        errorText.value = `Enter a key from ${MIN_KEY} to ${MAX_KEY}`;

        return;
    }

    const issues: PaletteIssue[] = addKey(key);
    const first: PaletteIssue | undefined = issues[0];

    if (first !== undefined) {
        errorText.value = first.message;

        return;
    }

    errorText.value = null;
    isOpen.value = false;
}
</script>
