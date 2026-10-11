<template>
    <div class="flex flex-col gap-3">
        <div class="flex flex-col">
            <p class="font-semibold text-highlighted">
                Highlighted heading
            </p>
            <p class="text-sm text-default">
                Default body text.
            </p>
            <p class="text-sm text-toned">
                Toned — secondary copy.
            </p>
            <p class="text-sm text-muted">
                Muted — labels and metadata.
            </p>
            <p class="text-sm text-dimmed">
                Dimmed — placeholders and hints.
            </p>
        </div>

        <div class="grid grid-cols-5 gap-1">
            <div
                v-for="layer in LAYERS"
                :key="layer.name"
                class="flex h-8 items-end rounded-md border border-default px-1.5 py-1 font-mono text-[10px]"
                :class="layer.class"
            >
                {{ layer.name }}
            </div>
        </div>

        <div class="flex flex-wrap gap-1.5">
            <UButton v-for="color in COLORS" :key="color" :color="color" :label="color" size="xs" />
        </div>

        <div class="flex flex-col gap-1.5">
            <div v-for="color in VARIANT_COLORS" :key="color" class="flex flex-wrap gap-1.5">
                <UButton
                    v-for="variant in BUTTON_VARIANTS"
                    :key="variant"
                    :color="color"
                    :variant="variant"
                    :label="variant"
                    size="xs"
                />
            </div>
        </div>

        <div class="flex flex-col gap-1.5">
            <div v-for="color in VARIANT_COLORS" :key="color" class="flex flex-wrap gap-1.5">
                <UBadge v-for="variant in BADGE_VARIANTS" :key="variant" :color="color" :variant="variant" :label="variant" size="sm" />
            </div>
        </div>

        <div class="flex flex-wrap items-center gap-4">
            <USwitch v-model="enabled" label="Switch" size="sm" />
            <UCheckbox v-model="checked" label="Checkbox" size="sm" />
            <UTabs v-model="tab" :items="TABS" :content="false" size="xs" />
        </div>

        <div class="flex flex-col gap-2.5">
            <USlider v-model="level" size="sm" />
            <UProgress v-model="level" size="sm" />
        </div>

        <div class="grid grid-cols-2 gap-2">
            <UInput placeholder="Search..." icon="i-material-symbols:search" size="sm" />
            <UInput placeholder="Subtle variant" variant="subtle" size="sm" />
        </div>

        <div class="grid grid-cols-2 gap-2">
            <UAlert
                title="Heads up"
                description="Primary subtle."
                icon="i-material-symbols:info-outline"
                variant="subtle"
                :ui="{ root: 'p-3' }"
            />
            <UAlert
                title="Failed"
                description="Error soft."
                icon="i-material-symbols:error-outline"
                color="error"
                variant="soft"
                :ui="{ root: 'p-3' }"
            />
        </div>

        <UChatPrompt v-model="prompt" placeholder="Chat prompt..." variant="subtle" :autofocus="false">
            <UChatPromptSubmit status="ready" />
        </UChatPrompt>
    </div>
</template>


<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui';
import { ref } from 'vue';


interface Layer {
    name: string;
    class: string;
}


const COLORS = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const;
const VARIANT_COLORS = ['primary', 'neutral'] as const;
const BUTTON_VARIANTS = ['solid', 'outline', 'soft', 'subtle', 'ghost', 'link'] as const;
const BADGE_VARIANTS = ['solid', 'outline', 'soft', 'subtle'] as const;

const LAYERS: Layer[] = [
    { name: 'bg', class: 'bg-default text-muted' },
    { name: 'muted', class: 'bg-muted text-muted' },
    { name: 'elevated', class: 'bg-elevated text-muted' },
    { name: 'accented', class: 'bg-accented text-muted' },
    { name: 'inverted', class: 'bg-inverted text-inverted' },
];

const TABS: TabsItem[] = [
    { label: 'Chat', value: 'chat' },
    { label: 'Files', value: 'files' },
];

const enabled = ref<boolean>(true);
const checked = ref<boolean>(true);
const tab = ref<string>('chat');
const level = ref<number>(60);
const prompt = ref<string>('');
</script>
