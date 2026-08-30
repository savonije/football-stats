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
        class="flex min-h-18 items-center justify-between gap-4 rounded bg-white p-4 shadow"
        data-testid="appearance"
    >
        <div class="flex items-center gap-1">
            <UButton
                v-if="editable"
                class="rounded-full"
                color="neutral"
                icon="i-lucide-pencil"
                variant="ghost"
                :aria-label="$t('match.editAppearance')"
                @click="emit('edit', appearance)"
            />

            <router-link
                class="text-primary font-medium"
                :to="{
                    name: 'playerDetail',
                    params: { id: appearance.playerId },
                }"
            >
                {{ appearance.playerName }}
            </router-link>
        </div>

        <div class="flex items-center gap-4">
            <div class="flex items-center gap-4 text-2xl">
                <span v-if="appearance.goals && appearance.goals > 0">
                    <span v-for="n in appearance.goals" :key="n">⚽</span>
                </span>
                <span v-if="appearance.isGoalkeeper">🧤</span>
            </div>
        </div>
    </div>
    <div v-else>
        <USkeleton class="h-16 w-full" />
    </div>
</template>
