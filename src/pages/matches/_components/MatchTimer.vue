<script setup lang="ts">
    import { computed, onMounted, onUnmounted, ref } from 'vue';
    import { useMatchStore } from '@/stores/matchStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import { useI18n } from 'vue-i18n';
    import { useToast } from 'primevue/usetoast';
    import { Button, useConfirm, Tag } from 'primevue';
    import { TOAST_LIFE } from '@/constants';
    import {
        formatMatchTime,
        getDisplaySeconds,
        hasStarted,
        isInOvertime,
    } from '@/utils/match';

    interface Props {
        seasonId: string;
    }

    const { seasonId } = defineProps<Props>();
    const matchStore = useMatchStore();
    const seasonStore = useSeasonStore();
    const toast = useToast();
    const confirm = useConfirm();
    const { t } = useI18n();

    const now = ref(Date.now());

    let timer: ReturnType<typeof setInterval>;

    onMounted(() => {
        timer = setInterval(() => {
            now.value = Date.now();
        }, 1000);
    });

    onUnmounted(() => {
        clearInterval(timer);
    });

    const duration = computed(() =>
        formatMatchTime(
            getDisplaySeconds(
                matchStore.selectedMatch,
                seasonStore.currentHalfDuration,
                now.value,
            ),
        ),
    );

    const overtime = computed(() =>
        isInOvertime(
            matchStore.selectedMatch,
            seasonStore.currentHalfDuration,
            now.value,
        ),
    );

    const isRunning = computed(() => matchStore.selectedMatch?.running);
    const isEnded = computed(() => matchStore.selectedMatch?.ended);
    const isHalfTime = computed(() => matchStore.selectedMatch?.halfTime);
    const started = computed(() => hasStarted(matchStore.selectedMatch));
    const half = computed(() => matchStore.selectedMatch?.half ?? 1);

    const halfLabel = computed(() => {
        if (isHalfTime.value) return t('match.halfTime');
        if (!started.value || isEnded.value) return '';
        return half.value === 2 ? t('match.secondHalf') : t('match.firstHalf');
    });

    const startMatch = () => {
        if (!matchStore.selectedMatch?.id) return;
        matchStore.startMatch(seasonId, matchStore.selectedMatch.id);
    };

    const endFirstHalf = async () => {
        if (!matchStore.selectedMatch?.id) return;

        confirm.require({
            message: t('match.endFirstHalfConfirm'),
            header: t('match.endFirstHalf'),
            rejectLabel: t('common.cancel'),
            acceptLabel: t('match.endFirstHalf'),
            acceptClass: 'p-button-success',
            accept: async () => {
                await matchStore.endFirstHalf(
                    seasonId,
                    matchStore.selectedMatch!.id,
                );
                toast.add({
                    severity: 'success',
                    summary: t('common.success'),
                    detail: t('match.messages.firstHalfEnded'),
                    life: TOAST_LIFE,
                });
            },
        });
    };

    const startSecondHalf = () => {
        if (!matchStore.selectedMatch?.id) return;
        matchStore.startSecondHalf(seasonId, matchStore.selectedMatch.id);
    };

    const endMatch = async () => {
        if (!matchStore.selectedMatch?.id) return;

        confirm.require({
            message: t('match.endMatchConfirm'),
            header: t('match.endMatch'),
            rejectLabel: t('common.cancel'),
            acceptLabel: t('match.endMatch'),
            acceptClass: 'p-button-success',
            accept: async () => {
                await matchStore.endMatch(
                    seasonId,
                    matchStore.selectedMatch!.id,
                );
                toast.add({
                    severity: 'success',
                    summary: t('common.success'),
                    detail: t('match.endMatchSuccess'),
                    life: TOAST_LIFE,
                });
            },
        });
    };
</script>

<template>
    <div v-if="matchStore.selectedMatch">
        <div
            v-if="!isEnded"
            class="mt-4 mb-6 flex flex-col items-center justify-between rounded-lg bg-gray-50 p-4 shadow md:flex-row"
        >
            <div class="flex w-full items-center gap-3 md:w-auto">
                <div class="flex items-center gap-3 text-2xl font-bold">
                    <span v-if="isRunning" class="relative flex h-3 w-3">
                        <span
                            class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"
                            aria-hidden="true"
                        />
                        <span
                            class="relative inline-flex h-3 w-3 rounded-full bg-red-500"
                        />
                    </span>
                    <span :class="{ 'text-red-600': overtime }">
                        {{ duration }}
                    </span>
                </div>

                <div v-if="halfLabel" class="mt-1 font-semibold text-gray-500">
                    {{ halfLabel }}
                </div>
            </div>

            <div
                v-if="seasonStore.isCurrentSeasonActive"
                class="mt-4 flex gap-2 md:mt-0"
            >
                <Button
                    v-if="!started"
                    :label="t('common.start')"
                    severity="success"
                    @click="startMatch"
                />
                <Button
                    v-if="isRunning && half === 1"
                    :label="t('match.endFirstHalf')"
                    severity="warning"
                    @click="endFirstHalf"
                />
                <Button
                    v-if="isHalfTime"
                    :label="t('match.startSecondHalf')"
                    severity="success"
                    @click="startSecondHalf"
                />
                <Button
                    v-if="isRunning && half === 2"
                    :label="t('match.endMatch')"
                    severity="danger"
                    @click="endMatch"
                />
            </div>
        </div>
        <div v-else class="flex justify-end">
            <Tag
                class="mb-6 text-gray-500 italic"
                :value="t('match.isEnded')"
            />
        </div>
    </div>
</template>
