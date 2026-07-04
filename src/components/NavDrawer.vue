<script setup lang="ts">
    import { ref, watch } from 'vue';
    import { useToast } from 'primevue';
    import Drawer from 'primevue/drawer';
    import { useI18n } from 'vue-i18n';

    import { useStoreAuth } from '@/stores/authStore';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { TOAST_LIFE } from '@/constants';

    import AddMatchDialog from '@/components/AddMatchDialog.vue';
    import AddPlayerDialog from '@/components/AddPlayerDialog.vue';
    import ManageSeasonsDialog from '@/components/ManageSeasonsDialog.vue';

    const storeAuth = useStoreAuth();
    const playerStore = usePlayerStore();
    const seasonStore = useSeasonStore();
    const toast = useToast();
    const { t } = useI18n();

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

    const logout = () => {
        drawerVisible.value = false;
        storeAuth.logoutUser(toast, t);
    };

    // TEMP: remove after the one-off per-season player migration has run.
    const migrating = ref(false);
    const onMigrate = async () => {
        migrating.value = true;
        try {
            const count = await playerStore.migratePlayerSeasons();
            toast.add({
                severity: 'success',
                summary: t('common.messages.success'),
                detail: `Migrated ${count} players`,
                life: TOAST_LIFE,
            });
        } catch (err) {
            console.error(err);
            toast.add({
                severity: 'error',
                summary: t('common.messages.error'),
                life: TOAST_LIFE,
            });
        } finally {
            migrating.value = false;
        }
    };

    defineExpose({
        open: () => {
            drawerVisible.value = true;
        },
    });
</script>

<template>
    <Drawer
        v-model:visible="drawerVisible"
        position="right"
        :header="t('common.menu')"
    >
        <div class="drawer-body" :class="{ animated: navAnimated }">
            <p class="section-label">{{ t('common.navigation') }}</p>
            <nav class="nav-list">
                <Router-Link
                    class="nav-item"
                    :to="{ name: 'home' }"
                    style="--i: 0"
                    @click="drawerVisible = false"
                >
                    <span
                        class="nav-icon"
                        style="background: var(--gradient-accent-blue)"
                    >
                        <i class="pi pi-home" />
                    </span>
                    <span>{{ t('match.game', 2) }}</span>
                    <i class="pi pi-chevron-right nav-chevron" />
                </Router-Link>

                <Router-Link
                    class="nav-item"
                    :to="{ name: 'topscorers' }"
                    style="--i: 1"
                    @click="drawerVisible = false"
                >
                    <span
                        class="nav-icon"
                        style="background: var(--gradient-accent-amber)"
                    >
                        <i class="pi pi-chart-bar" />
                    </span>
                    <span>{{ t('common.toplist') }}</span>
                    <i class="pi pi-chevron-right nav-chevron" />
                </Router-Link>

                <Router-Link
                    class="nav-item"
                    :to="{ name: 'players' }"
                    style="--i: 2"
                    @click="drawerVisible = false"
                >
                    <span
                        class="nav-icon"
                        style="background: var(--gradient-accent-teal)"
                    >
                        <i class="pi pi-users" />
                    </span>
                    <span>{{ t('player.player', 2) }}</span>
                    <i class="pi pi-chevron-right nav-chevron" />
                </Router-Link>
            </nav>

            <template v-if="storeAuth.user?.id">
                <p class="section-label mt-8">{{ t('common.manage') }}</p>
                <nav class="nav-list">
                    <button
                        v-if="seasonStore.isCurrentSeasonActive"
                        class="nav-item"
                        style="--i: 3"
                        @click="openAddMatch"
                    >
                        <span
                            class="nav-icon"
                            style="background: var(--gradient-accent-green)"
                        >
                            <i class="pi pi-plus" />
                        </span>
                        <span>{{ t('match.addMatch') }}</span>
                        <i class="pi pi-chevron-right nav-chevron" />
                    </button>
                    <button
                        class="nav-item"
                        style="--i: 4"
                        @click="openAddPlayer"
                    >
                        <span
                            class="nav-icon"
                            style="background: var(--gradient-accent-purple)"
                        >
                            <i class="pi pi-user-plus" />
                        </span>
                        <span>{{ t('player.addPlayer') }}</span>
                        <i class="pi pi-chevron-right nav-chevron" />
                    </button>
                    <button
                        class="nav-item"
                        style="--i: 5"
                        @click="openManageSeasons"
                    >
                        <span
                            class="nav-icon"
                            style="background: var(--gradient-accent-teal)"
                        >
                            <i class="pi pi-calendar" />
                        </span>
                        <span>{{ t('seasons.manageSeasons') }}</span>
                        <i class="pi pi-chevron-right nav-chevron" />
                    </button>
                    <!-- TEMP: remove after the per-season player migration -->
                    <button
                        class="nav-item"
                        style="--i: 6"
                        :disabled="migrating"
                        @click="onMigrate"
                    >
                        <span
                            class="nav-icon"
                            style="background: var(--gradient-accent-amber)"
                        >
                            <i
                                class="pi"
                                :class="
                                    migrating
                                        ? 'pi-spin pi-spinner'
                                        : 'pi-database'
                                "
                            />
                        </span>
                        <span>⚠️ Migrate players</span>
                        <i class="pi pi-chevron-right nav-chevron" />
                    </button>
                </nav>

                <div class="mt-10">
                    <button
                        class="nav-item nav-item--danger"
                        style="--i: 7"
                        @click="logout"
                    >
                        <span
                            class="nav-icon"
                            style="background: var(--gradient-accent-red)"
                        >
                            <i class="pi pi-sign-out" />
                        </span>
                        <span>{{ t('auth.logout') }}</span>
                    </button>
                </div>
            </template>

            <template v-else>
                <div class="mt-10">
                    <Router-Link
                        class="nav-item"
                        :to="{ name: 'auth' }"
                        style="--i: 3"
                        @click="drawerVisible = false"
                    >
                        <span
                            class="nav-icon"
                            style="background: var(--gradient-accent-green)"
                        >
                            <i class="pi pi-sign-in" />
                        </span>
                        <span>{{ t('auth.login') }}</span>
                        <i class="pi pi-chevron-right nav-chevron" />
                    </Router-Link>
                </div>
            </template>
        </div>
    </Drawer>

    <AddMatchDialog v-model:visible="showAddMatchDialog" />
    <AddPlayerDialog v-model:visible="showAddPlayerDialog" />
    <ManageSeasonsDialog v-model:visible="showManageSeasonsDialog" />
</template>

<style scoped>
    .drawer-body {
        display: flex;
        flex-direction: column;
        padding-top: 2rem;
    }

    .section-label {
        font-size: 0.65rem;
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.4);
        margin-bottom: 6px;
    }

    .nav-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 10px;
        cursor: pointer;
        background: transparent;
        border: none;
        width: 100%;
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.95rem;
        font-weight: 500;
        text-decoration: none;
        text-align: left;
        transition:
            background 0.18s ease,
            color 0.18s ease;
        opacity: 0;
        transform: translateX(16px);
    }

    .nav-item:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
    }

    .nav-item:hover .nav-chevron {
        transform: translateX(3px);
    }

    .nav-item--danger {
        color: rgba(252, 165, 165, 0.85);
    }

    .nav-item--danger:hover {
        background: rgba(239, 68, 68, 0.15);
        color: rgb(252, 165, 165);
    }

    .nav-icon {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.9rem;
        flex-shrink: 0;
        color: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    }

    .nav-chevron {
        margin-left: auto;
        font-size: 0.65rem;
        opacity: 0.4;
        transition: transform 0.18s ease;
    }

    /* Staggered entrance via CSS custom property --i */
    .animated .nav-item {
        animation: nav-slide-in 0.3s ease-out calc(0.05s + var(--i, 0) * 0.07s)
            forwards;
    }

    @keyframes nav-slide-in {
        from {
            opacity: 0;
            transform: translateX(16px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
</style>
