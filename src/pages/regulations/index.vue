<script setup lang="ts">
    import type { EditorToolbarItem } from '@nuxt/ui/components/EditorToolbar.vue';
    import type { EditorHandler } from '@nuxt/ui/runtime/types/editor.js';
    import { TableKit } from '@tiptap/extension-table';
    import { onMounted, ref } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { useAppToast } from '@/composables/useAppToast';
    import { useIsAdmin } from '@/composables/useIsAdmin';
    import { useRegulationsStore } from '@/stores/regulationsStore';

    const { t } = useI18n();
    const toast = useAppToast();
    const isAdmin = useIsAdmin();
    const regulationsStore = useRegulationsStore();

    const draft = ref('');
    const editing = ref(false);
    const saving = ref(false);

    onMounted(() => regulationsStore.fetchRegulations());

    type Chain = ReturnType<Parameters<EditorHandler['execute']>[0]['chain']>;

    const tableCommand = (command: (chain: Chain) => Chain): EditorHandler => ({
        canExecute: (editor) => command(editor.can().chain().focus()).run(),
        execute: (editor) => command(editor.chain().focus()),
        isActive: () => false,
    });

    const handlers = {
        insertTable: tableCommand((chain) =>
            chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
        ),
        addRow: tableCommand((chain) => chain.addRowAfter()),
        addColumn: tableCommand((chain) => chain.addColumnAfter()),
        deleteRow: tableCommand((chain) => chain.deleteRow()),
        deleteColumn: tableCommand((chain) => chain.deleteColumn()),
        deleteTable: tableCommand((chain) => chain.deleteTable()),
    };

    const extensions = [TableKit];

    const tableClasses =
        '[&_.tableWrapper]:overflow-x-auto [&_table]:w-full [&_table]:border-collapse [&_:is(th,td)]:border [&_:is(th,td)]:border-gray-200 [&_:is(th,td)]:px-3 [&_:is(th,td)]:py-2 [&_:is(th,td)]:text-left [&_:is(th,td)]:align-top [&_th]:bg-primary-50 [&_th]:font-semibold [&_.selectedCell]:bg-primary-100';

    const toolbarItems: EditorToolbarItem<typeof handlers>[][] = [
        [
            {
                kind: 'heading',
                level: 2,
                icon: 'i-lucide-heading-2',
                tooltip: { text: t('regulations.toolbar.heading2') },
            },
            {
                kind: 'heading',
                level: 3,
                icon: 'i-lucide-heading-3',
                tooltip: { text: t('regulations.toolbar.heading3') },
            },
        ],
        [
            {
                kind: 'mark',
                mark: 'bold',
                icon: 'i-lucide-bold',
                tooltip: { text: t('regulations.toolbar.bold') },
            },
            {
                kind: 'mark',
                mark: 'italic',
                icon: 'i-lucide-italic',
                tooltip: { text: t('regulations.toolbar.italic') },
            },
        ],
        [
            {
                kind: 'bulletList',
                icon: 'i-lucide-list',
                tooltip: { text: t('regulations.toolbar.bulletList') },
            },
            {
                kind: 'orderedList',
                icon: 'i-lucide-list-ordered',
                tooltip: { text: t('regulations.toolbar.orderedList') },
            },
            {
                kind: 'blockquote',
                icon: 'i-lucide-text-quote',
                tooltip: { text: t('regulations.toolbar.blockquote') },
            },
            {
                icon: 'i-lucide-table',
                tooltip: { text: t('regulations.toolbar.table') },
                items: [
                    [
                        {
                            kind: 'insertTable',
                            icon: 'i-lucide-table',
                            label: t('regulations.toolbar.insertTable'),
                        },
                    ],
                    [
                        {
                            kind: 'addRow',
                            icon: 'i-lucide-between-horizontal-end',
                            label: t('regulations.toolbar.addRow'),
                        },
                        {
                            kind: 'addColumn',
                            icon: 'i-lucide-between-vertical-end',
                            label: t('regulations.toolbar.addColumn'),
                        },
                    ],
                    [
                        {
                            kind: 'deleteRow',
                            icon: 'i-lucide-trash-2',
                            label: t('regulations.toolbar.deleteRow'),
                        },
                        {
                            kind: 'deleteColumn',
                            icon: 'i-lucide-trash-2',
                            label: t('regulations.toolbar.deleteColumn'),
                        },
                        {
                            kind: 'deleteTable',
                            icon: 'i-lucide-trash-2',
                            label: t('regulations.toolbar.deleteTable'),
                        },
                    ],
                ],
            },
        ],
        [
            {
                kind: 'undo',
                icon: 'i-lucide-undo',
                tooltip: { text: t('regulations.toolbar.undo') },
            },
            {
                kind: 'redo',
                icon: 'i-lucide-redo',
                tooltip: { text: t('regulations.toolbar.redo') },
            },
        ],
    ];

    const startEditing = () => {
        draft.value = regulationsStore.content;
        editing.value = true;
    };

    const save = async () => {
        saving.value = true;
        try {
            await regulationsStore.updateRegulations(draft.value);
            toast.success(t('common.changesSaved'));
            editing.value = false;
        } catch (err) {
            console.error(err);
            toast.error(t('regulations.saveError'));
        } finally {
            saving.value = false;
        }
    };
</script>

<template>
    <Teleport defer to="#page-actions">
        <UButton
            v-if="isAdmin && regulationsStore.regulationsLoaded && !editing"
            icon="i-lucide-pencil"
            :label="t('common.edit')"
            variant="subtle"
            @click="startEditing"
        />
    </Teleport>

    <div class="rounded-2xl bg-white p-4 shadow-lg sm:p-6">
        <template v-if="editing">
            <UEditor
                v-slot="{ editor }"
                v-model="draft"
                content-type="markdown"
                :extensions="extensions"
                :handlers="handlers"
                :placeholder="t('regulations.placeholder')"
                :ui="{ base: ['min-h-64 sm:px-0', tableClasses] }"
            >
                <UEditorToolbar
                    class="mb-4 overflow-x-auto border-b border-gray-200 pb-2"
                    :editor="editor"
                    :items="toolbarItems"
                />
            </UEditor>

            <div class="mt-6 flex justify-end gap-2">
                <UButton
                    color="neutral"
                    :label="t('common.cancel')"
                    variant="subtle"
                    @click="editing = false"
                />
                <UButton
                    icon="i-lucide-check"
                    :label="t('common.save')"
                    :loading="saving"
                    @click="save"
                />
            </div>
        </template>

        <template v-else>
            <p v-if="!regulationsStore.regulationsLoaded" class="text-gray-500">
                {{ t('common.loadingData') }}
            </p>
            <p v-else-if="!regulationsStore.content" class="text-gray-500">
                {{ t('regulations.empty') }}
            </p>
            <UEditor
                v-else
                :model-value="regulationsStore.content"
                content-type="markdown"
                :editable="false"
                :extensions="extensions"
                :ui="{ base: ['sm:px-0', tableClasses] }"
            />
        </template>
    </div>
</template>
