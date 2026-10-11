<template>
    <UTabs
        :items="TABS"
        default-value="pins"
        :content="true"
        size="xs"
        class="flex h-full min-h-0 flex-col"
        :ui="{ content: 'min-h-0 flex-1 overflow-hidden' }"
    >
        <template #pins>
            <div class="h-full overflow-y-auto p-2">
                <PinList />
            </div>
        </template>

        <template #colors>
            <div class="h-full overflow-y-auto p-2">
                <ColorList />
            </div>
        </template>
    </UTabs>
</template>


<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui';


const TABS: TabsItem[] = [
    { label: 'Pins', value: 'pins', slot: 'pins' },
    { label: 'Colors', value: 'colors', slot: 'colors' },
];
</script>
