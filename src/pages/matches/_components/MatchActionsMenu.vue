<script setup lang="ts">
    import type { DropdownMenuItem } from '@nuxt/ui/components/DropdownMenu.vue';
    import { computed, ref } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { useRouter } from 'vue-router';

    import AddMatchPlayersDialog from '@/pages/matches/_components/AddMatchPlayersDialog.vue';
    import EditMatchDialog from '@/pages/matches/_components/EditMatchDialog.vue';
    import { useAppToast } from '@/composables/useAppToast';
    import { useCanEdit } from '@/composables/useCanEdit';
    import { useConfirmDialog } from '@/composables/useConfirmDialog';
    import { useMatchStore } from '@/stores/matchStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import type { Match } from '@/types';

    const { match } = defineProps<{ match: Match }>();

    const { t } = useI18n();
    const toast = useAppToast();
    const confirm = useConfirmDialog();
    const router = useRouter();
    const matchStore = useMatchStore();
    const seasonStore = useSeasonStore();
    const canEdit = useCanEdit();

    const addingPlayers = ref(false);
    const editingMatch = ref(false);

    const confirmDeleteMatch = async () => {
        const confirmed = await confirm({
            title: t('match.deleteMatch'),
            message: t('match.deleteMatchConfirm'),
            confirmLabel: t('common.delete'),
            confirmColor: 'error',
        });

        if (!confirmed) return;

        await matchStore.deleteMatch(seasonStore.currentSeason, match.id);
        toast.success(t('match.deleteMatchSuccess'));
        router.push({ name: 'home' });
    };

    const matchMenuItems = computed<DropdownMenuItem[][]>(() => [
        [
            ...(match.ended
                ? []
                : [
                      {
                          label: t('match.addPlayers'),
                          icon: 'i-lucide-user-plus',
                          onSelect: () => (addingPlayers.value = true),
                      },
                  ]),
            {
                label: t('match.editMatch'),
                icon: 'i-lucide-pencil',
                onSelect: () => (editingMatch.value = true),
            },
        ],
        [
            {
                label: t('match.deleteMatch'),
                icon: 'i-lucide-trash',
                color: 'error' as const,
                onSelect: confirmDeleteMatch,
            },
        ],
    ]);
</script>

<template>
    <template v-if="canEdit">
        <UDropdownMenu :items="matchMenuItems">
            <UButton
                color="neutral"
                icon="i-lucide-ellipsis-vertical"
                variant="subtle"
                :aria-label="t('common.moreOptions')"
            />
        </UDropdownMenu>

        <AddMatchPlayersDialog
            v-if="!match.ended"
            v-model:visible="addingPlayers"
            :match-id="match.id"
            :season-id="seasonStore.currentSeason"
        />

        <EditMatchDialog
            v-model:visible="editingMatch"
            :match="match"
            :season-id="seasonStore.currentSeason"
        />
    </template>
</template>
