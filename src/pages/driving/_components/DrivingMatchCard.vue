<script setup lang="ts">
    import { computed, ref } from 'vue';
    import { useI18n } from 'vue-i18n';

    import ExtraCarDialog from '@/pages/driving/_components/ExtraCarDialog.vue';

    import { useAppToast } from '@/composables/useAppToast';
    import { useCanEdit } from '@/composables/useCanEdit';
    import { CLUBNAME } from '@/constants';
    import { useMatchStore } from '@/stores/matchStore';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import type { MatchDriving } from '@/types';
    import type { DrivingPlan } from '@/utils/driving';
    import { isAlwaysDriverInSeason } from '@/utils/playerSeason';

    const { plan } = defineProps<{ plan: DrivingPlan }>();

    const matchStore = useMatchStore();
    const playerStore = usePlayerStore();
    const seasonStore = useSeasonStore();
    const canEdit = useCanEdit();
    const toast = useAppToast();
    const { t } = useI18n();

    const addingCar = ref(false);
    const date = computed(() => plan.match.date.toDate());
    const editable = computed(() => canEdit.value && !plan.past);
    const excluded = computed(() => plan.match.driving?.excluded ?? []);
    const meetingTime = computed(() => plan.match.driving?.meetingTime ?? '');

    // A squad that grew shows the missing cars as empty places; drivers past
    // what the squad needs are extra cars.
    const cars = computed(() =>
        Array.from(
            { length: Math.max(plan.needed, plan.drivers.length) },
            (_, index) => ({
                playerId: plan.drivers[index] ?? null,
                extra: index >= plan.needed,
            }),
        ),
    );

    const nameOf = (playerId: string) =>
        playerStore.getPlayerById(playerId)?.name ?? '?';

    const isAlwaysDriver = (playerId: string) => {
        const player = playerStore.getPlayerById(playerId);
        return (
            !!player &&
            isAlwaysDriverInSeason(player, seasonStore.currentSeason)
        );
    };

    const carLabel = (playerId: string, extra: boolean) => {
        if (extra) return t('driving.extraCar');
        if (isAlwaysDriver(playerId)) return t('driving.alwaysDrives');
        return t(plan.past ? 'driving.driven' : 'driving.planned');
    };

    const save = async (driving: MatchDriving) => {
        await matchStore.updateMatchDriving(
            seasonStore.currentSeason,
            plan.match.id,
            driving,
        );
        toast.success(t('common.changesSaved'));
    };

    const removeCar = (index: number) =>
        save({ drivers: plan.drivers.filter((_, i) => i !== index) });

    // The next parent in the rotation takes over the car; with nobody left
    // the place stays empty.
    const cannotDrive = (index: number, playerId: string) => {
        const { next } = plan;
        return save({
            drivers: next
                ? plan.drivers.map((id, i) => (i === index ? next : id))
                : plan.drivers.filter((_, i) => i !== index),
            excluded: [...excluded.value, playerId],
        });
    };

    const saveMeetingTime = (event: Event) =>
        save({ meetingTime: (event.target as HTMLInputElement).value });

    const restore = (playerId: string) =>
        save({ excluded: excluded.value.filter((id) => id !== playerId) });
</script>

<template>
    <article
        class="shadow-card flex flex-col gap-4 rounded-xl bg-white p-4 sm:p-5"
    >
        <div class="flex items-center gap-4">
            <div
                class="bg-primary-50 flex size-14 shrink-0 flex-col items-center justify-center rounded-xl"
            >
                <span class="text-primary text-xl leading-none font-black">
                    {{ date.toLocaleDateString('nl-NL', { day: 'numeric' }) }}
                </span>
                <span
                    class="tracking-label text-xxs text-primary-600 font-mono font-bold uppercase"
                >
                    {{ date.toLocaleDateString('nl-NL', { month: 'short' }) }}
                </span>
            </div>

            <div class="min-w-0 flex-1">
                <p class="text-primary-900 mb-0 truncate text-lg font-bold">
                    {{ plan.match.opponent }}
                </p>
                <p
                    v-if="plan.match.location"
                    class="text-primary-700 mb-0 flex items-start gap-1.5 text-sm font-semibold"
                >
                    <UIcon
                        class="text-primary-400 mt-0.5 size-4 shrink-0"
                        name="i-lucide-map-pin"
                    />
                    {{ plan.match.location }}
                </p>
            </div>
        </div>

        <div
            v-if="editable || meetingTime"
            class="text-primary-700 flex items-center gap-2 text-sm font-semibold"
        >
            <UIcon
                class="text-primary-400 size-4 shrink-0"
                name="i-lucide-clock"
            />
            <span>{{ t('driving.meetingTime', { club: CLUBNAME }) }}</span>
            <UInput
                v-if="editable"
                :aria-label="t('driving.meetingTime', { club: CLUBNAME })"
                :model-value="meetingTime"
                size="sm"
                type="time"
                @change="saveMeetingTime"
            />
            <span v-else class="text-primary-900">{{ meetingTime }}</span>
        </div>

        <div class="flex flex-wrap items-center gap-2">
            <UBadge
                color="neutral"
                icon="i-lucide-users"
                :label="t('driving.players', plan.squadSize)"
                variant="subtle"
            />
            <UBadge icon="i-lucide-car">
                {{ t('driving.cars', cars.length) }}
                <template v-if="cars.length > plan.needed">
                    {{
                        t('driving.extraCount', {
                            count: cars.length - plan.needed,
                        })
                    }}
                </template>
            </UBadge>
        </div>

        <ul
            class="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3"
        >
            <li
                v-for="(car, index) in cars"
                :key="index"
                class="flex min-h-14 items-center gap-3 rounded-xl border py-1 pr-1 pl-3"
                :class="[
                    !car.playerId
                        ? 'border-dashed border-amber-600 bg-amber-50 text-amber-800'
                        : car.extra
                          ? 'border-primary-300 bg-white'
                          : 'border-primary-200 bg-primary-50',
                ]"
            >
                <span
                    class="flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold"
                    :class="
                        car.playerId
                            ? 'bg-primary text-white'
                            : 'border border-dashed border-amber-600'
                    "
                >
                    {{ index + 1 }}
                </span>

                <div v-if="car.playerId" class="min-w-0 flex-1">
                    <p class="text-primary-950 mb-0 truncate font-bold">
                        {{ nameOf(car.playerId) }}
                    </p>
                    <p
                        class="text-primary-600 mb-0 flex items-center gap-1 text-xs"
                    >
                        <UIcon
                            v-if="!car.extra && isAlwaysDriver(car.playerId)"
                            class="text-amber-700"
                            name="i-lucide-star"
                        />
                        {{ carLabel(car.playerId, car.extra) }}
                    </p>
                </div>
                <span v-else class="flex-1 text-sm font-semibold">
                    {{ t('driving.driverNeeded') }}
                </span>

                <UButton
                    v-if="editable && car.extra"
                    :aria-label="t('driving.removeExtraCar')"
                    color="neutral"
                    icon="i-lucide-x"
                    size="lg"
                    variant="ghost"
                    @click="removeCar(index)"
                />
                <UButton
                    v-else-if="editable && car.playerId"
                    :aria-label="
                        t('driving.cannotDriveLabel', {
                            name: nameOf(car.playerId),
                        })
                    "
                    color="neutral"
                    icon="i-lucide-x"
                    size="lg"
                    variant="ghost"
                    @click="cannotDrive(index, car.playerId)"
                />
            </li>
        </ul>

        <div
            v-if="editable && excluded.length"
            class="text-primary-800 flex flex-wrap items-center gap-2 text-sm"
        >
            <span class="font-semibold">{{ t('driving.cannotDrive') }}</span>
            <UButton
                v-for="playerId in excluded"
                :key="playerId"
                :aria-label="
                    t('driving.restoreLabel', { name: nameOf(playerId) })
                "
                class="rounded-full"
                color="neutral"
                size="sm"
                trailing-icon="i-lucide-undo-2"
                variant="outline"
                @click="restore(playerId)"
            >
                <span class="line-through">{{ nameOf(playerId) }}</span>
            </UButton>
        </div>

        <UButton
            v-if="editable"
            block
            class="border-primary-300 border border-dashed"
            icon="i-lucide-plus"
            :label="t('driving.extraCar')"
            size="lg"
            variant="soft"
            @click="addingCar = true"
        />

        <ExtraCarDialog
            v-if="addingCar"
            v-model:open="addingCar"
            :plan="plan"
        />
    </article>
</template>
