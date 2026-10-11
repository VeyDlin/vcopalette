<template>
    <UApp>
        <UDashboardGroup unit="px" storage="local" storage-key="vcopalette">
            <UDashboardSidebar
                resizable
                collapsible
                :default-size="300"
                :min-size="260"
                :max-size="520"
            >
                <template #header>
                    <h2 class="text-sm font-medium text-highlighted">
                        Palette
                    </h2>
                </template>

                <template #default="{ collapsed }">
                    <PinsPanel v-if="!collapsed" />
                </template>
            </UDashboardSidebar>

            <UDashboardPanel :ui="{ body: 'p-4 sm:p-5' }">
                <template #header>
                    <UDashboardNavbar title="vcopalette">
                        <template #right>
                            <AppHeader :theme-error="themeError" />
                        </template>
                    </UDashboardNavbar>
                </template>

                <template #body>
                    <div class="flex h-full flex-col gap-6 xl:flex-row">
                        <div class="flex h-full min-h-0 w-max shrink-0 flex-col gap-4">
                            <PaletteTile />
                            <PinInspector class="w-full" />
                            <CodePanel class="min-h-0 flex-1" />
                        </div>
                        <UiPreview class="min-w-0 flex-1" />
                    </div>
                </template>
            </UDashboardPanel>
        </UDashboardGroup>
    </UApp>
</template>


<script setup lang="ts">
import { useThemeInjection } from '~/composables/useThemeInjection';


const { themeError } = useThemeInjection();
</script>
