<script setup lang="ts">
    import { useTimeoutFn } from '@vueuse/core';
    import { computed, ref, watch, type Ref } from 'vue';
    import { useI18n } from 'vue-i18n';

    import AddMatchDialog from '@/components/dialogs/AddMatchDialog.vue';
    import AddPlayerDialog from '@/components/dialogs/AddPlayerDialog.vue';
    import ManageSeasonsDialog from '@/components/dialogs/ManageSeasonsDialog.vue';

    import { useAppToast } from '@/composables/useAppToast';
    import { useStoreAuth } from '@/stores/authStore';
    import { useSeasonStore } from '@/stores/seasonStore';

    const storeAuth = useStoreAuth();
    const seasonStore = useSeasonStore();
    const { t } = useI18n();
    const toast = useAppToast();

    const drawerVisible = ref(false);
    const navAnimated = ref(false);
    const showAddMatchDialog = ref(false);
    const showAddPlayerDialog = ref(false);
    const showManageSeasonsDialog = ref(false);

    const { start: startNavAnimation, stop: stopNavAnimation } = useTimeoutFn(
        () => {
            navAnimated.value = true;
        },
        120,
        { immediate: false },
    );

    watch(drawerVisible, (val) => {
        if (val) {
            startNavAnimation();
        } else {
            stopNavAnimation();
            navAnimated.value = false;
        }
    });

    const navLinks = computed(() => [
        {
            to: { name: 'home' },
            icon: 'i-lucide-house',
            iconClass: 'bg-[image:var(--gradient-accent-blue)]',
            label: t('match.game', 2),
        },
        {
            to: { name: 'topscorers' },
            icon: 'i-lucide-chart-column',
            iconClass: 'bg-[image:var(--gradient-accent-amber)]',
            label: t('common.toplist'),
        },
        {
            to: { name: 'players' },
            icon: 'i-lucide-users',
            iconClass: 'bg-[image:var(--gradient-accent-teal)]',
            label: t('player.player', 2),
        },
        {
            to: { name: 'washing' },
            icon: 'i-lucide-sparkles',
            iconClass: 'bg-[image:var(--gradient-accent-purple)]',
            label: t('washing.title'),
        },
        {
            to: { name: 'training' },
            icon: 'i-lucide-calendar',
            iconClass: 'bg-[image:var(--gradient-accent-green)]',
            label: t('training.title'),
        },
    ]);

    const manageActions = computed(() => [
        {
            show: seasonStore.isCurrentSeasonActive,
            icon: 'i-lucide-plus',
            iconClass: 'bg-[image:var(--gradient-accent-green)]',
            label: t('match.addMatch'),
            dialog: showAddMatchDialog,
        },
        {
            show: true,
            icon: 'i-lucide-user-plus',
            iconClass: 'bg-[image:var(--gradient-accent-purple)]',
            label: t('player.addPlayer'),
            dialog: showAddPlayerDialog,
        },
        {
            show: true,
            icon: 'i-lucide-calendar',
            iconClass: 'bg-[image:var(--gradient-accent-teal)]',
            label: t('seasons.manageSeasons'),
            dialog: showManageSeasonsDialog,
        },
    ]);

    const openDialog = (dialog: Ref<boolean>) => {
        drawerVisible.value = false;
        dialog.value = true;
    };

    const logout = async () => {
        drawerVisible.value = false;
        try {
            await storeAuth.logoutUser();
            toast.success(t('auth.logoutMessage'), t('auth.logoutSuccess'));
        } catch (error) {
            toast.error((error as Error).message, t('errors.error'));
        }
    };

    const navItem =
        'flex w-full items-center gap-3 rounded-lg border-none bg-transparent px-3 py-2.5 text-left text-base font-medium text-white/80 no-underline opacity-0 transition-colors duration-200 [animation-delay:calc(0.05s+var(--i,0)*0.07s)] hover:bg-white/10 hover:text-white';
    const navIcon =
        'shadow-icon flex size-9 shrink-0 items-center justify-center rounded-lg text-sm text-white';
    const navChevron = 'ml-auto text-xxs opacity-40 transition-transform';
    const sectionLabel =
        'mb-1.5 text-xxs font-extrabold tracking-widest text-white/40 font-mono uppercase';

    defineExpose({
        open: () => {
            drawerVisible.value = true;
        },
    });
</script>

<template>
    <USlideover
        v-model:open="drawerVisible"
        side="right"
        :title="t('common.menu')"
        :ui="{
            content: 'bg-[image:var(--gradient-drawer)] shadow-drawer',
            header: 'border-b border-white/10 bg-white/[0.04]',
            title: 'text-xxs font-extrabold tracking-[0.12em] text-white font-mono uppercase',
            close: 'text-white/60 hover:bg-white/10 hover:text-white',
            body: 'pt-8',
        }"
    >
        <template #body>
            <div
                class="flex flex-col"
                :class="navAnimated && '[&_.nav-item]:animate-nav-slide-in'"
            >
                <p :class="sectionLabel">{{ t('common.navigation') }}</p>
                <nav class="flex flex-col gap-0.5">
                    <Router-Link
                        v-for="(link, index) in navLinks"
                        :key="link.label"
                        class="nav-item group"
                        :class="navItem"
                        :style="{ '--i': index }"
                        :to="link.to"
                        @click="drawerVisible = false"
                    >
                        <span :class="[navIcon, link.iconClass]">
                            <UIcon :name="link.icon" />
                        </span>
                        <span>{{ link.label }}</span>
                        <UIcon
                            class="group-hover:translate-x-[3px]"
                            :class="navChevron"
                            name="i-lucide-chevron-right"
                        />
                    </Router-Link>
                </nav>

                <template v-if="storeAuth.user?.id">
                    <p class="mt-8" :class="sectionLabel">
                        {{ t('common.manage') }}
                    </p>
                    <nav class="flex flex-col gap-0.5">
                        <template
                            v-for="(action, index) in manageActions"
                            :key="action.label"
                        >
                            <button
                                v-if="action.show"
                                class="nav-item group"
                                :class="navItem"
                                :style="{ '--i': navLinks.length + index }"
                                @click="openDialog(action.dialog)"
                            >
                                <span :class="[navIcon, action.iconClass]">
                                    <UIcon :name="action.icon" />
                                </span>
                                <span>{{ action.label }}</span>
                                <UIcon
                                    class="group-hover:translate-x-[3px]"
                                    :class="navChevron"
                                    name="i-lucide-chevron-right"
                                />
                            </button>
                        </template>
                    </nav>

                    <div class="mt-10">
                        <button
                            class="nav-item group text-red-300/85 hover:bg-red-500/15 hover:text-red-300"
                            :class="navItem"
                            :style="{
                                '--i': navLinks.length + manageActions.length,
                            }"
                            @click="logout"
                        >
                            <span
                                class="bg-[image:var(--gradient-accent-red)]"
                                :class="navIcon"
                            >
                                <UIcon name="i-lucide-log-out" />
                            </span>
                            <span>{{ t('auth.logout') }}</span>
                        </button>
                    </div>
                </template>

                <div v-else class="mt-10">
                    <Router-Link
                        class="nav-item group"
                        :class="navItem"
                        style="--i: 4"
                        :to="{ name: 'auth' }"
                        @click="drawerVisible = false"
                    >
                        <span
                            class="bg-[image:var(--gradient-accent-green)]"
                            :class="navIcon"
                        >
                            <UIcon name="i-lucide-log-in" />
                        </span>
                        <span>{{ t('auth.login') }}</span>
                        <UIcon
                            class="group-hover:translate-x-[3px]"
                            :class="navChevron"
                            name="i-lucide-chevron-right"
                        />
                    </Router-Link>
                </div>
            </div>
        </template>
    </USlideover>

    <AddMatchDialog v-model:visible="showAddMatchDialog" />
    <AddPlayerDialog v-model:visible="showAddPlayerDialog" />
    <ManageSeasonsDialog v-model:visible="showManageSeasonsDialog" />
</template>
