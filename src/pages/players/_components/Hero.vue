<script setup lang="ts">
    import { computed } from 'vue';
    import { Button, Skeleton } from 'primevue';

    import { useStoreAuth } from '@/stores/authStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import type { Player } from '@/types';
    import { isGuestInSeason } from '@/utils/playerSeason';

    const { player, loading } = defineProps<{
        player: Player | null;
        loading: boolean;
    }>();

    defineEmits<{ edit: [] }>();

    const authStore = useStoreAuth();
    const seasonStore = useSeasonStore();

    const isGuest = computed(() =>
        player ? isGuestInSeason(player, seasonStore.currentSeason) : false,
    );
</script>

<template>
    <div
        class="shadow-hero relative mb-6 overflow-hidden rounded-2xl [background:var(--gradient-brand)]"
    >
        <div
            class="pointer-events-none absolute inset-0 [background:repeating-linear-gradient(-55deg,transparent,transparent_20px,rgba(255,255,255,0.015)_20px,rgba(255,255,255,0.015)_40px)]"
            aria-hidden="true"
        />

        <div class="relative z-10 flex flex-wrap items-center gap-5 p-6">
            <div
                class="flex size-18 shrink-0 items-center justify-center rounded-full border-[3px] border-white/25 bg-white/12 text-3xl font-black text-white"
            >
                <span v-if="player">
                    {{ player.name.charAt(0).toUpperCase() }}
                </span>
                <i v-else class="pi pi-user" />
            </div>

            <div class="min-w-0 flex-1">
                <Skeleton
                    v-if="loading || !player"
                    class="mb-2"
                    height="36px"
                    width="180px"
                />
                <h1
                    v-else
                    class="mb-0 truncate text-3xl font-black text-white lg:text-4xl"
                >
                    {{ player.name }}
                </h1>
                <span
                    v-if="!loading && isGuest"
                    class="text-xxs tracking-badge mt-1 inline-block rounded-full border border-white/25 bg-white/12 px-2 py-0.5 font-bold text-white/75 uppercase"
                >
                    {{ $t('player.guestPlayer') }}
                </span>
            </div>

            <Button
                v-if="player && authStore.user?.id"
                class="shrink-0 border-white/30! bg-white/12! px-2! text-white! hover:border-white/50! hover:bg-white/22! sm:px-4!"
                icon="pi pi-pencil"
                :label="$t('common.edit')"
                variant="outlined"
                size="small"
                :pt="{ label: { class: 'hidden sm:inline-block' } }"
                @click="$emit('edit')"
            />
        </div>
    </div>
</template>
