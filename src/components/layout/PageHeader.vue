<script setup lang="ts">
    import { ref, onMounted } from 'vue';
    import Button from 'primevue/button';
    import Select from 'primevue/select';
    import { useI18n } from 'vue-i18n';

    import { useSeasonStore } from '@/stores/seasonStore';

    import NavDrawer from '@/components/layout/NavDrawer.vue';

    import { CLUBNAME } from '@/constants';

    const seasonStore = useSeasonStore();
    const { t } = useI18n();

    const navDrawer = ref<InstanceType<typeof NavDrawer>>();

    onMounted(() => {
        seasonStore.fetchSeasons();
    });
</script>

<template>
    <header
        class="header-root sticky top-0 z-50 mb-12 py-3 text-white sm:p-3 sm:py-5"
    >
        <div
            class="relative z-10 container flex items-center justify-between gap-6"
        >
            <div class="flex items-center gap-4">
                <Router-Link
                    class="logo-link hidden lg:flex"
                    :to="{ name: 'home' }"
                >
                    <img
                        class="max-h-14"
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
                    <Select
                        v-if="seasonStore.seasonsLoaded"
                        class="mt-1 text-xs!"
                        :model-value="seasonStore.currentSeason"
                        :options="seasonStore.seasons"
                        option-label="id"
                        option-value="id"
                        size="small"
                        @update:model-value="seasonStore.setSeason"
                    />
                    <span v-else class="text-xs text-white/70">{{
                        seasonStore.currentSeason
                    }}</span>
                </div>
            </div>

            <Button
                class="hover:text-primary-300! text-white! hover:bg-white/10!"
                icon="pi pi-bars"
                text
                rounded
                :aria-label="t('common.menu')"
                @click="navDrawer?.open()"
            />
        </div>
    </header>

    <NavDrawer ref="navDrawer" />
</template>

<style scoped>
    .header-root {
        background: var(--gradient-brand);
        box-shadow:
            0 4px 24px rgba(17, 26, 54, 0.45),
            0 1px 0 rgba(255, 255, 255, 0.07) inset;
        position: relative;
        overflow: hidden;
    }

    /* Diagonal pitch-stripe texture overlay */
    .header-root::before {
        content: '';
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(
            -55deg,
            transparent,
            transparent 20px,
            rgba(255, 255, 255, 0.018) 20px,
            rgba(255, 255, 255, 0.018) 40px
        );
        pointer-events: none;
        z-index: 0;
    }

    .logo-link img {
        transition: filter 0.3s ease;
    }

    .logo-link:hover img {
        filter: drop-shadow(0 0 10px rgba(96, 133, 209, 0.85));
    }

    @keyframes header-shimmer {
        0% {
            transform: translateX(-120%) skewX(-20deg);
            opacity: 0;
        }
        10% {
            opacity: 1;
        }
        90% {
            opacity: 1;
        }
        100% {
            transform: translateX(280%) skewX(-20deg);
            opacity: 0;
        }
    }
</style>
