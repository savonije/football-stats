<script setup lang="ts">
    import type { MatchInfoRow } from '@/composables/useMatchInfoRows';

    const { row, compact = false } = defineProps<{
        row: MatchInfoRow;
        compact?: boolean;
    }>();
</script>

<template>
    <div
        class="border-primary-100 flex items-center border-t"
        :class="compact ? 'gap-3 px-4 py-2.5' : 'gap-3.5 px-4 py-3.5'"
    >
        <span
            class="bg-primary-50 text-primary flex shrink-0 items-center justify-center"
            :class="compact ? 'size-7 rounded-md' : 'size-9 rounded-lg'"
        >
            <UIcon
                :class="compact ? 'size-3.5' : 'size-4.5'"
                :name="row.icon"
            />
        </span>

        <span class="flex min-w-0 flex-1 flex-col">
            <span
                class="text-gray-600"
                :class="compact ? 'text-xxs' : 'text-xs'"
            >
                {{ row.label }}
            </span>
            <span
                class="text-primary-900 font-bold"
                :class="compact && 'text-sm leading-snug'"
            >
                {{ row.value }}
            </span>
        </span>

        <UButton
            v-if="row.href && !compact"
            class="shrink-0"
            :aria-label="$t('match.venue.openInMaps')"
            :label="$t('match.venue.maps')"
            size="sm"
            target="_blank"
            :to="row.href"
            trailing
            variant="soft"
        />
    </div>
</template>
