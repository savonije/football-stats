<script setup lang="ts">
    import { computed, ref } from 'vue';
    import { Button, Menu, useConfirm } from 'primevue';
    import type { MenuItem } from 'primevue/menuitem';
    import { useToast } from 'primevue/usetoast';
    import { useI18n } from 'vue-i18n';
    import { useRouter } from 'vue-router';

    import AddMatchPlayersDialog from '@/pages/matches/_components/AddMatchPlayersDialog.vue';
    import EditMatchDialog from '@/pages/matches/_components/EditMatchDialog.vue';
    import { useCanEdit } from '@/composables/useCanEdit';
    import { TOAST_LIFE } from '@/constants';
    import { useMatchStore } from '@/stores/matchStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import type { Match } from '@/types';

    const { match } = defineProps<{ match: Match }>();

    const { t } = useI18n();
    const toast = useToast();
    const confirm = useConfirm();
    const router = useRouter();
    const matchStore = useMatchStore();
    const seasonStore = useSeasonStore();
    const canEdit = useCanEdit();

    const matchMenu = ref<InstanceType<typeof Menu> | null>(null);
    const addingPlayers = ref(false);
    const editingMatch = ref(false);

    const deleteMatch = async () => {
        await matchStore.deleteMatch(seasonStore.currentSeason, match.id);

        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('match.deleteMatchSuccess'),
            life: TOAST_LIFE,
        });

        router.push({ name: 'home' });
    };

    const confirmDeleteMatch = () =>
        confirm.require({
            message: t('match.deleteMatchConfirm'),
            header: t('match.deleteMatch'),
            icon: 'pi pi-exclamation-triangle',
            rejectLabel: t('common.cancel'),
            acceptLabel: t('common.delete'),
            acceptClass: 'p-button-danger',
            accept: deleteMatch,
        });

    const matchMenuItems = computed<MenuItem[]>(() => [
        {
            label: t('match.addPlayers'),
            icon: 'pi pi-user-plus',
            visible: !match.ended,
            command: () => (addingPlayers.value = true),
        },
        {
            label: t('match.editMatch'),
            icon: 'pi pi-pencil',
            command: () => (editingMatch.value = true),
        },
        { separator: true },
        {
            label: t('match.deleteMatch'),
            icon: 'pi pi-trash',
            danger: true,
            command: confirmDeleteMatch,
        },
    ]);
</script>

<template>
    <template v-if="canEdit">
        <Button
            severity="secondary"
            icon="pi pi-ellipsis-v"
            :aria-label="t('common.moreOptions')"
            aria-haspopup="true"
            aria-controls="match-menu"
            @click="matchMenu?.toggle($event)"
        />

        <Menu id="match-menu" ref="matchMenu" :model="matchMenuItems" popup>
            <template #item="{ item, props }">
                <a class="flex items-center gap-2" v-bind="props.action">
                    <span
                        class="flex items-center gap-2"
                        :class="{ 'text-red-500': item.danger }"
                    >
                        <span :class="item.icon" />
                        {{ item.label }}
                    </span>
                </a>
            </template>
        </Menu>

        <AddMatchPlayersDialog
            v-if="!match.ended"
            v-model:visible="addingPlayers"
            :season-id="seasonStore.currentSeason"
            :match-id="match.id"
        />

        <EditMatchDialog
            v-model:visible="editingMatch"
            :season-id="seasonStore.currentSeason"
            :match="match"
        />
    </template>
</template>
