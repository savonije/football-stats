<script setup lang="ts">
    import type { AppearanceWithName } from '@/types';

    const { appearance, editable } = defineProps<{
        appearance: AppearanceWithName;
        editable: boolean;
    }>();

    const emit = defineEmits<{ edit: [appearance: AppearanceWithName] }>();
</script>

<template>
    <div
        v-if="appearance && appearance.playerName"
        class="shadow-card flex min-h-18 items-center justify-between gap-3 rounded-xl bg-white py-2 pr-2 pl-4 sm:pl-5"
        data-testid="appearance"
    >
        <router-link
            class="text-primary font-medium"
            :to="{
                name: 'playerDetail',
                params: { id: appearance.playerId },
            }"
        >
            {{ appearance.playerName }}
        </router-link>

        <div class="flex items-center gap-2">
            <span
                v-if="appearance.goals && appearance.goals > 0"
                class="bg-amber/10 inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-base font-bold text-amber-700 tabular-nums"
                :title="$t('common.goal', 2)"
                data-testid="appearance-goals"
            >
                <UIcon class="size-4" name="i-lucide-goal" />
                {{ appearance.goals }}
            </span>

            <span
                v-if="appearance.isGoalkeeper"
                class="bg-primary/8 tracking-label text-primary inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold uppercase"
            >
                <UIcon class="size-4" name="i-lucide-hand" />
                {{ $t('player.keeper') }}
            </span>

            <UButton
                v-if="editable"
                class="rounded-full"
                :aria-label="$t('match.editAppearance')"
                color="neutral"
                icon="i-lucide-pencil"
                variant="ghost"
                @click="emit('edit', appearance)"
            />
        </div>
    </div>

    <div v-else>
        <USkeleton class="h-16 w-full" />
    </div>
</template>
