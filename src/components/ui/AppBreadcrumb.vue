<script setup lang="ts">
    import { useI18n } from 'vue-i18n';
    import { useRoute } from 'vue-router';

    defineProps<{
        label?: string;
    }>();

    const route = useRoute();
    const { t } = useI18n();
</script>

<template>
    <nav
        v-if="route.meta.breadcrumb"
        class="mb-4 flex items-center gap-1.5 text-xs font-medium"
    >
        <template v-for="(crumb, i) in route.meta.breadcrumb" :key="i">
            <Router-Link
                class="text-primary-500 hover:text-primary-700 flex items-center gap-[5px] no-underline transition-colors duration-150"
                :to="crumb.to"
            >
                <UIcon v-if="crumb.icon" :name="crumb.icon" />
                {{ t(crumb.labelKey, crumb.count ?? 1) }}
            </Router-Link>
            <UIcon
                class="text-primary-300 text-xs"
                name="i-lucide-chevron-right"
            />
        </template>
        <span class="text-primary-300 flex items-center">
            <USkeleton v-if="label === undefined" class="h-3.5 w-20" />
            <span v-else>{{ label }}</span>
        </span>
    </nav>
</template>
