<template>
    <div class="flex items-center gap-2">
        <UBadge v-if="themeError !== null" color="error" variant="subtle" class="max-w-72 truncate" :title="themeError">
            {{ themeError }}
        </UBadge>

        <UPopover>
            <UButton label="Aliases" color="neutral" variant="ghost" size="sm" trailing-icon="i-material-symbols:expand-more" />
            <template #content>
                <div class="flex w-64 flex-col gap-2 p-3">
                    <div v-for="alias in ALIASES" :key="alias" class="flex items-center justify-between gap-2">
                        <span class="font-mono text-xs text-muted">{{ alias }}</span>
                        <USelect
                            :model-value="aliases[alias]"
                            :items="colorNames"
                            size="xs"
                            class="w-32"
                            @update:model-value="(value: string | undefined) => onAliasChange(alias, value)"
                        />
                    </div>
                </div>
            </template>
        </UPopover>

        <UDropdownMenu :items="configItems">
            <UButton label="Config" color="neutral" variant="ghost" size="sm" trailing-icon="i-material-symbols:expand-more" />
        </UDropdownMenu>

        <UButton
            label="Reset"
            icon="i-material-symbols:restart-alt"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="reset"
        />
        <UButton
            :label="isDark ? 'Dark' : 'Light'"
            :icon="isDark ? 'i-material-symbols:dark-mode-outline' : 'i-material-symbols:light-mode-outline'"
            :title="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
            color="neutral"
            variant="outline"
            size="sm"
            class="w-20 justify-center"
            @click="toggleTheme"
        />
    </div>
</template>


<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';
import type { PaletteIssue } from 'vcopalette';
import type { NuxtUiAlias } from 'vcopalette/nuxt-ui';
import type { ComputedRef } from 'vue';
import { computed } from 'vue';
import { useExports } from '~/composables/useExports';
import { usePlayground } from '~/composables/usePlayground';


interface AppHeaderProps {
    themeError: string | null;
}


const ALIASES: readonly NuxtUiAlias[] = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'];

const props = defineProps<AppHeaderProps>();

const { palette, aliases, exportConfig, importConfig, setAliases, reset } = usePlayground();
const { outputs } = useExports();
const toast = useToast();
const colorMode = useColorMode();

const colorNames: ComputedRef<string[]> = computed<string[]>((): string[] => Object.keys(palette.value));
const isDark: ComputedRef<boolean> = computed<boolean>((): boolean => colorMode.value === 'dark');

const configItems: DropdownMenuItem[][] = [
    [
        {
            label: 'Copy config JSON',
            icon: 'i-material-symbols:content-copy-outline',
            onSelect: (): void => {
                copyText(exportConfig(), 'config JSON');
            },
        },
        {
            label: 'Import config from clipboard',
            icon: 'i-material-symbols:content-paste',
            onSelect: (): void => {
                importFromClipboard();
            },
        },
    ],
    [
        {
            label: 'Copy CSS variables',
            icon: 'i-material-symbols:data-object',
            onSelect: (): void => {
                copyText(outputs.value.css, 'CSS variables');
            },
        },
        {
            label: 'Copy Tailwind theme',
            icon: 'i-material-symbols:data-object',
            onSelect: (): void => {
                copyText(outputs.value.tailwind, 'Tailwind theme');
            },
        },
        {
            label: 'Copy Nuxt UI theme',
            icon: 'i-material-symbols:data-object',
            onSelect: (): void => {
                copyNuxtUiTheme();
            },
        },
        {
            label: 'Copy DTCG JSON',
            icon: 'i-material-symbols:data-object',
            onSelect: (): void => {
                copyText(outputs.value.dtcg, 'DTCG JSON');
            },
        },
    ],
];


function copyText(text: string, label: string): void {
    navigator.clipboard.writeText(text).then((): void => {
        toast.add({ title: 'Copied', description: label, color: 'success', duration: 1500 });
    });
}


function copyNuxtUiTheme(): void {
    if (props.themeError !== null) {
        toast.add({
            title: 'Not copied',
            description: props.themeError,
            color: 'error',
        });

        return;
    }

    copyText(outputs.value['nuxt-ui'], 'Nuxt UI theme');
}


function importFromClipboard(): void {
    navigator.clipboard.readText().then((text: string): void => {
        const issues: PaletteIssue[] = importConfig(text);
        const first: PaletteIssue | undefined = issues[0];

        if (first === undefined) {
            toast.add({ title: 'Config imported', color: 'success', duration: 2000 });

            return;
        }

        toast.add({ title: 'Not imported', description: first.message, color: 'error' });
    });
}


function onAliasChange(alias: NuxtUiAlias, value: string | undefined): void {
    if (value === undefined) {
        return;
    }

    setAliases({ ...aliases.value, [alias]: value });
}


function toggleTheme(): void {
    colorMode.preference = isDark.value ? 'light' : 'dark';
}
</script>
