<script setup lang="ts">
    import { computed } from 'vue';

    import { useIsAdmin } from '@/composables/useIsAdmin';
    import { useSeasonStore } from '@/stores/seasonStore';
    import type { Player } from '@/types';
    import { isGuestInSeason } from '@/utils/playerSeason';

    const { player, loading } = defineProps<{
        player: Player | null;
        loading: boolean;
    }>();

    defineEmits<{ edit: [] }>();

    const isAdmin = useIsAdmin();
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
                <UIcon v-else name="i-lucide-user" />
            </div>

            <div class="min-w-0 flex-1">
                <USkeleton v-if="loading || !player" class="mb-2 h-9 w-45" />
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

            <UButton
                v-if="player && isAdmin"
                class="shrink-0 border-white/30! bg-white/12! px-2! text-white! hover:border-white/50! hover:bg-white/22! sm:px-4!"
                color="neutral"
                icon="i-lucide-pencil"
                :label="$t('common.edit')"
                size="sm"
                :ui="{ label: 'hidden sm:inline-block' }"
                variant="outline"
                @click="$emit('edit')"
            />
        </div>
    </div>
</template>
