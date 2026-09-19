import UButton from '@nuxt/ui/components/Button.vue';
import type { Column } from '@tanstack/vue-table';
import { h } from 'vue';

export const TABLE_UI = {
    root: 'bg-white',
    th: 'bg-[image:var(--gradient-table-header)] text-primary-800 px-2 font-bold tracking-wide sm:px-4',
    tr: 'cursor-pointer transition-colors duration-150 even:bg-primary-50/40 hover:bg-primary-50',
    td: 'text-primary-900 px-2 sm:px-4',
};

export const sortableHeader =
    <T>(label: string) =>
    ({ column }: { column: Column<T> }) => {
        const direction = column.getIsSorted();

        return h(UButton, {
            label,
            color: 'neutral',
            variant: 'ghost',
            size: 'sm',
            class: '-mx-2.5 font-bold',
            icon: direction
                ? direction === 'asc'
                    ? 'i-lucide-chevron-up'
                    : 'i-lucide-chevron-down'
                : 'i-lucide-chevrons-up-down',
            trailing: true,
            onClick: () => column.toggleSorting(direction === 'asc'),
        });
    };
