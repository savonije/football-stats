<script setup lang="ts">
    import { ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { useAppToast } from '@/composables/useAppToast';
    import { useStoreAuth } from '@/stores/authStore';
    import { useSeasonStore } from '@/stores/seasonStore';

    import AddMatchDialog from '@/components/dialogs/AddMatchDialog.vue';
    import AddPlayerDialog from '@/components/dialogs/AddPlayerDialog.vue';
    import ManageSeasonsDialog from '@/components/dialogs/ManageSeasonsDialog.vue';

    const storeAuth = useStoreAuth();
    const seasonStore = useSeasonStore();
    const { t } = useI18n();
    const toast = useAppToast();

    const drawerVisible = ref(false);
    const navAnimated = ref(false);
    const showAddMatchDialog = ref(false);
    const showAddPlayerDialog = ref(false);
    const showManageSeasonsDialog = ref(false);

    watch(drawerVisible, (val) => {
        if (val) {
            setTimeout(() => {
                navAnimated.value = true;
            }, 120);
        } else {
            navAnimated.value = false;
        }
    });

    const openAddMatch = () => {
        drawerVisible.value = false;
        showAddMatchDialog.value = true;
    };

    const openAddPlayer = () => {
        drawerVisible.value = false;
        showAddPlayerDialog.value = true;
    };

    const openManageSeasons = () => {
        drawerVisible.value = false;
        showManageSeasonsDialog.value = true;
    };

    const logout = async () => {
        drawerVisible.value = false;
        try {
            await storeAuth.logoutUser();
            toast.success(t('auth.logoutMessage'), t('auth.logoutSuccess'));
        } catch (error) {
            toast.error((error as Error).message, t('error.generic'));
        }
    };

    const navItem =
        'flex w-full items-center gap-3 rounded-lg border-none bg-transparent px-3 py-2.5 text-left text-base font-medium text-white/80 no-underline opacity-0 transition-colors duration-200 [animation-delay:calc(0.05s+var(--i,0)*0.07s)] hover:bg-white/10 hover:text-white';
    const navIcon =
        'shadow-icon flex size-9 shrink-0 items-center justify-center rounded-lg text-sm text-white';
    const navChevron = 'ml-auto text-xxs opacity-40 transition-transform';
    const sectionLabel =
        'mb-1.5 text-xxs font-extrabold tracking-widest text-white/40 uppercase';

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
            title: 'text-xxs font-extrabold tracking-[0.12em] text-white uppercase',
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
                        class="nav-item group"
                        :class="navItem"
                        style="--i: 0"
                        :to="{ name: 'home' }"
                        @click="drawerVisible = false"
                    >
                        <span
                            class="bg-[image:var(--gradient-accent-blue)]"
                            :class="navIcon"
                        >
                            <UIcon name="i-lucide-house" />
                        </span>
                        <span>{{ t('match.game', 2) }}</span>
                        <UIcon
                            class="group-hover:translate-x-[3px]"
                            :class="navChevron"
                            name="i-lucide-chevron-right"
                        />
                    </Router-Link>

                    <Router-Link
                        class="nav-item group"
                        :class="navItem"
                        style="--i: 1"
                        :to="{ name: 'topscorers' }"
                        @click="drawerVisible = false"
                    >
                        <span
                            class="bg-[image:var(--gradient-accent-amber)]"
                            :class="navIcon"
                        >
                            <UIcon name="i-lucide-chart-column" />
                        </span>
                        <span>{{ t('common.toplist') }}</span>
                        <UIcon
                            class="group-hover:translate-x-[3px]"
                            :class="navChevron"
                            name="i-lucide-chevron-right"
                        />
                    </Router-Link>

                    <Router-Link
                        class="nav-item group"
                        :class="navItem"
                        style="--i: 2"
                        :to="{ name: 'players' }"
                        @click="drawerVisible = false"
                    >
                        <span
                            class="bg-[image:var(--gradient-accent-teal)]"
                            :class="navIcon"
                        >
                            <UIcon name="i-lucide-users" />
                        </span>
                        <span>{{ t('player.player', 2) }}</span>
                        <UIcon
                            class="group-hover:translate-x-[3px]"
                            :class="navChevron"
                            name="i-lucide-chevron-right"
                        />
                    </Router-Link>

                    <Router-Link
                        class="nav-item group"
                        :class="navItem"
                        style="--i: 3"
                        :to="{ name: 'washing' }"
                        @click="drawerVisible = false"
                    >
                        <span
                            class="bg-[image:var(--gradient-accent-purple)]"
                            :class="navIcon"
                        >
                            <UIcon name="i-lucide-sparkles" />
                        </span>
                        <span>{{ t('washing.title') }}</span>
                        <UIcon
                            class="group-hover:translate-x-[3px]"
                            :class="navChevron"
                            name="i-lucide-chevron-right"
                        />
                    </Router-Link>

                    <Router-Link
                        class="nav-item group"
                        :class="navItem"
                        style="--i: 4"
                        :to="{ name: 'training' }"
                        @click="drawerVisible = false"
                    >
                        <span
                            class="bg-[image:var(--gradient-accent-green)]"
                            :class="navIcon"
                        >
                            <UIcon name="i-lucide-calendar" />
                        </span>
                        <span>{{ t('training.title') }}</span>
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
                        <button
                            v-if="seasonStore.isCurrentSeasonActive"
                            class="nav-item group"
                            :class="navItem"
                            style="--i: 4"
                            @click="openAddMatch"
                        >
                            <span
                                class="bg-[image:var(--gradient-accent-green)]"
                                :class="navIcon"
                            >
                                <UIcon name="i-lucide-plus" />
                            </span>
                            <span>{{ t('match.addMatch') }}</span>
                            <UIcon
                                class="group-hover:translate-x-[3px]"
                                :class="navChevron"
                                name="i-lucide-chevron-right"
                            />
                        </button>
                        <button
                            class="nav-item group"
                            :class="navItem"
                            style="--i: 5"
                            @click="openAddPlayer"
                        >
                            <span
                                class="bg-[image:var(--gradient-accent-purple)]"
                                :class="navIcon"
                            >
                                <UIcon name="i-lucide-user-plus" />
                            </span>
                            <span>{{ t('player.addPlayer') }}</span>
                            <UIcon
                                class="group-hover:translate-x-[3px]"
                                :class="navChevron"
                                name="i-lucide-chevron-right"
                            />
                        </button>
                        <button
                            class="nav-item group"
                            :class="navItem"
                            style="--i: 6"
                            @click="openManageSeasons"
                        >
                            <span
                                class="bg-[image:var(--gradient-accent-teal)]"
                                :class="navIcon"
                            >
                                <UIcon name="i-lucide-calendar" />
                            </span>
                            <span>{{ t('seasons.manageSeasons') }}</span>
                            <UIcon
                                class="group-hover:translate-x-[3px]"
                                :class="navChevron"
                                name="i-lucide-chevron-right"
                            />
                        </button>
                    </nav>

                    <div class="mt-10">
                        <button
                            class="nav-item group text-red-300/85 hover:bg-red-500/15 hover:text-red-300"
                            :class="navItem"
                            style="--i: 8"
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

                <template v-else>
                    <div class="mt-10">
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
                </template>
            </div>
        </template>
    </USlideover>

    <AddMatchDialog v-model:visible="showAddMatchDialog" />
    <AddPlayerDialog v-model:visible="showAddPlayerDialog" />
    <ManageSeasonsDialog v-model:visible="showManageSeasonsDialog" />
</template>
