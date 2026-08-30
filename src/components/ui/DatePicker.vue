<script setup lang="ts">
    import type { CalendarDate } from '@internationalized/date';
    import dayjs from 'dayjs';
    import { computed, ref } from 'vue';

    import { fromCalendarDate } from '@/utils/date';

    const { id, placeholder } = defineProps<{
        id?: string;
        placeholder?: string;
    }>();

    const model = defineModel<CalendarDate | undefined>();

    const open = ref(false);

    const label = computed(() => {
        const date = fromCalendarDate(model.value);
        return date ? dayjs(date).format('DD-MM-YYYY') : (placeholder ?? '');
    });

    const select = (value: CalendarDate | undefined) => {
        model.value = value;
        open.value = false;
    };
</script>

<template>
    <UPopover v-model:open="open">
        <UButton
            :id="id"
            class="justify-start font-normal"
            block
            color="neutral"
            icon="i-lucide-calendar"
            :label="label"
            variant="outline"
            data-testid="date-input"
        />

        <template #content>
            <UCalendar
                :model-value="model"
                @update:model-value="select($event as CalendarDate | undefined)"
            />
        </template>
    </UPopover>
</template>
