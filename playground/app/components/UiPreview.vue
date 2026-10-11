<template>
    <section class="flex flex-col gap-2">
        <div class="flex items-center justify-between gap-4">
            <h2 class="text-sm font-medium text-highlighted">
                Components
            </h2>
            <span class="font-mono text-[11px] text-dimmed">--ui-primary = primary-{{ primaryShade }}</span>
        </div>

        <div class="grid gap-4 xl:grid-cols-2">
            <div class="flex flex-col gap-1.5">
                <span class="font-mono text-[11px] text-dimmed">surface · bg-default</span>
                <div class="p-4">
                    <PreviewSample />
                </div>
            </div>
            <div class="flex flex-col gap-1.5">
                <span class="font-mono text-[11px] text-dimmed">card · soft · bg-elevated/50</span>
                <UCard variant="soft" :ui="{ body: 'p-4 sm:p-4' }">
                    <PreviewSample />
                </UCard>
            </div>
        </div>
    </section>
</template>


<script setup lang="ts">
import { computed } from 'vue';


/** Shades Nuxt UI binds --ui-primary to in each mode. */
const LIGHT_PRIMARY_SHADE: number = 500;
const DARK_PRIMARY_SHADE: number = 400;

const colorMode = useColorMode();

const primaryShade = computed<number>(() => colorMode.value === 'dark' ? DARK_PRIMARY_SHADE : LIGHT_PRIMARY_SHADE);
</script>
