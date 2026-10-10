<script setup lang="ts">
    import { ref, onMounted } from 'vue';
    import { useI18n } from 'vue-i18n';

    import NavDrawer from '@/components/layout/NavDrawer.vue';

    import { CLUBNAME } from '@/constants';
    import { useSeasonStore } from '@/stores/seasonStore';

    const seasonStore = useSeasonStore();
    const { t } = useI18n();

    const navDrawer = ref<InstanceType<typeof NavDrawer>>();

    onMounted(() => {
        seasonStore.fetchSeasons();
    });
</script>

<template>
    <header
        class="relative z-50 mb-12 overflow-hidden py-3 text-white [background:var(--gradient-header)] sm:p-3 sm:py-5"
    >
        <div
            class="pointer-events-none absolute inset-0 bg-[image:var(--texture-noise)] opacity-45 mix-blend-overlay"
            aria-hidden="true"
        />
        <div
            class="relative z-10 container flex items-center justify-between gap-6"
        >
            <div class="flex items-center gap-4">
                <Router-Link class="hidden lg:flex" :to="{ name: 'home' }">
                    <img
                        class="max-h-14 transition-[filter] duration-300"
                        src="/images/logo.webp"
                        :alt="`${CLUBNAME} ${seasonStore.currentTeamName} logo`"
                    />
                </Router-Link>

                <div>
                    <Router-Link :to="{ name: 'home' }">
                        <h1
                            class="mb-0 text-xl font-black tracking-tight text-white lg:text-3xl"
                        >
                            {{ CLUBNAME }}
                            <span class="text-primary-300 mx-1 font-thin"
                                >|</span
                            >
                            <span class="text-primary-200 font-semibold">{{
                                seasonStore.currentTeamName
                            }}</span>
                        </h1>
                    </Router-Link>
                    <USelect
                        v-if="seasonStore.seasonsLoaded"
                        class="mt-1 text-xs!"
                        label-key="id"
                        :items="seasonStore.seasons"
                        :model-value="seasonStore.currentSeason"
                        size="sm"
                        value-key="id"
                        @update:model-value="seasonStore.setSeason"
                    />
                    <span v-else class="text-xs text-white/70">{{
                        seasonStore.currentSeason
                    }}</span>
                </div>
            </div>

            <UButton
                class="hover:text-primary-300! rounded-full text-white! hover:bg-white/10!"
                color="neutral"
                icon="i-lucide-menu"
                variant="ghost"
                :aria-label="t('common.menu')"
                @click="navDrawer?.open()"
            />
        </div>
    </header>

    <NavDrawer ref="navDrawer" />
</template>
