<template>
    <section class="flex flex-col rounded-lg border border-default bg-elevated/40">
        <header class="flex items-center justify-between gap-2 border-b border-default px-2">
            <UTabs
                :items="tabs"
                :model-value="activeTab"
                size="xs"
                :content="false"
                variant="link"
                class="min-w-0"
                @update:model-value="onTabChange"
            />
            <UButton
                label="Copy"
                icon="i-material-symbols:content-copy-outline"
                color="neutral"
                variant="ghost"
                size="xs"
                @click="onCopy"
            />
        </header>

        <div class="flex min-h-0 flex-1 flex-col">
            <template v-if="activeTab === 'config'">
                <div class="min-h-0 flex-1">
                    <textarea
                        v-model="text"
                        spellcheck="false"
                        autocomplete="off"
                        class="h-full w-full resize-none bg-transparent p-3 font-mono text-xs leading-relaxed text-default outline-none"
                        @input="onInput"
                        @focus="focused = true"
                        @blur="onBlur"
                    />
                </div>

                <footer class="flex h-7 shrink-0 items-center border-t border-default px-3 text-xs">
                    <p v-if="statusText !== null" class="truncate text-error" :title="statusText">
                        {{ statusText }}
                    </p>
                    <p v-else-if="dirty" class="text-muted">
                        Applied
                    </p>
                </footer>
            </template>

            <pre
                v-else
                class="h-full overflow-auto p-3 font-mono text-xs leading-relaxed text-toned select-text"
            >{{ outputs[activeTab] }}</pre>
        </div>
    </section>
</template>


<script setup lang="ts">
import type { PaletteIssue } from 'vcopalette';
import type { ComputedRef, Ref } from 'vue';
import type { ExportKind } from '~/composables/useExports';
import { computed, onUnmounted, ref, watch } from 'vue';
import { useExports } from '~/composables/useExports';
import { usePlayground } from '~/composables/usePlayground';


type CodeTab = 'config' | ExportKind;


const DEBOUNCE_MS: number = 300;

const tabs: { value: CodeTab; label: string }[] = [
    { value: 'config', label: 'Config' },
    { value: 'palette', label: 'Palette' },
    { value: 'css', label: 'CSS' },
    { value: 'tailwind', label: 'Tailwind' },
    { value: 'nuxt-ui', label: 'Nuxt UI' },
    { value: 'dtcg', label: 'DTCG' },
];

const { config, exportConfig, importConfig } = usePlayground();
const { outputs } = useExports();
const toast = useToast();

const activeTab: Ref<CodeTab> = ref<CodeTab>('config');
const text: Ref<string> = ref<string>(exportConfig());
const dirty: Ref<boolean> = ref<boolean>(false);
const focused: Ref<boolean> = ref<boolean>(false);
const status: Ref<PaletteIssue | null> = ref<PaletteIssue | null>(null);
let applyTimer: ReturnType<typeof setTimeout> | null = null;

const visibleText: ComputedRef<string> = computed<string>((): string => {
    if (activeTab.value === 'config') {
        return text.value;
    }

    return outputs.value[activeTab.value];
});

const statusText: ComputedRef<string | null> = computed<string | null>((): string | null => {
    const issue: PaletteIssue | null = status.value;

    if (issue === null) {
        return null;
    }

    return issue.path === '' ? issue.message : `${issue.path}: ${issue.message}`;
});


// While the field has focus the typed text wins; otherwise the config is the
// source of truth, so Reset or a tile edit replaces even a broken draft.
watch(config, (): void => {
    if (focused.value) {
        return;
    }

    cancelPendingApply();
    text.value = exportConfig();
    dirty.value = false;
    status.value = null;
}, { deep: true });


onUnmounted((): void => {
    cancelPendingApply();
});


function cancelPendingApply(): void {
    if (applyTimer !== null) {
        clearTimeout(applyTimer);
        applyTimer = null;
    }
}


/** Returns true when the text was applied to the config. */
function applyText(): boolean {
    const issues: PaletteIssue[] = importConfig(text.value);
    const first: PaletteIssue | undefined = issues[0];

    status.value = first ?? null;

    return first === undefined;
}


function onTabChange(value: string | number | undefined): void {
    const next: { value: CodeTab; label: string } | undefined = tabs.find((tab: { value: CodeTab; label: string }): boolean => tab.value === value);

    if (next !== undefined) {
        activeTab.value = next.value;
    }
}


function onInput(): void {
    dirty.value = true;
    cancelPendingApply();

    applyTimer = setTimeout((): void => {
        applyTimer = null;
        applyText();
    }, DEBOUNCE_MS);
}


function onBlur(): void {
    focused.value = false;
    cancelPendingApply();

    if (!dirty.value) {
        return;
    }

    if (applyText()) {
        text.value = exportConfig();
        dirty.value = false;
    }
}


function onCopy(): void {
    navigator.clipboard.writeText(visibleText.value).then((): void => {
        toast.add({ title: 'Copied', color: 'success', duration: 1500 });
    });
}
</script>
