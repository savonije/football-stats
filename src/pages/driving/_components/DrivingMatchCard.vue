<script setup lang="ts">
    import dayjs from 'dayjs';
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { useAppToast } from '@/composables/useAppToast';
    import { useCanEdit } from '@/composables/useCanEdit';
    import { useMatchStore } from '@/stores/matchStore';
    import { usePlayerStore } from '@/stores/playerStore';
    import { useSeasonStore } from '@/stores/seasonStore';
    import type { Match, MatchDriving } from '@/types';
    import { hasKickoffTime } from '@/utils/date';
    import type { Car, DrivingPlan } from '@/utils/driving';

    const { match, plan } = defineProps<{
        match: Match;
        plan: DrivingPlan;
    }>();

    const emit = defineEmits<{ addCar: [] }>();

    const matchStore = useMatchStore();
    const playerStore = usePlayerStore();
    const seasonStore = useSeasonStore();
    const canEdit = useCanEdit();
    const toast = useAppToast();
    const { t } = useI18n();

    const date = computed(() => match.date.toDate());
    const editable = computed(() => canEdit.value && !plan.past);
    const excluded = computed(() => match.driving?.excluded ?? []);
    const extraCars = computed(() => match.driving?.extraCars ?? []);

    const nameOf = (playerId: string) =>
        playerStore.getPlayerById(playerId)?.name ?? '?';

    const carLabel = (car: Car) => {
        if (car.picked) return t('driving.pickedExtraCar');
        if (car.extraIndex !== null) return t('driving.extraCar');
        if (car.alwaysDrives) return t('driving.alwaysDrives');
        return t(plan.past ? 'driving.driven' : 'driving.planned');
    };

    const save = async (driving: MatchDriving) => {
        await matchStore.updateMatchDriving(
            seasonStore.currentSeason,
            match.id,
            driving,
        );
        toast.success(t('common.changesSaved'));
    };

    const removeCar = (car: Car) =>
        car.extraIndex === null
            ? save({ excluded: [...excluded.value, car.playerId as string] })
            : save({
                  extraCars: extraCars.value.filter(
                      (_, index) => index !== car.extraIndex,
                  ),
              });

    const restore = (playerId: string) =>
        save({ excluded: excluded.value.filter((id) => id !== playerId) });
</script>

<template>
    <article
        class="shadow-card flex flex-col gap-4 rounded-xl bg-white p-4 sm:p-5"
        data-testid="driving-match"
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
                    {{ match.opponent }}
                </p>
                <p class="mb-0 text-sm text-gray-600">
                    {{ date.toLocaleDateString('nl-NL', { weekday: 'long' }) }}
                    <template v-if="hasKickoffTime(date)">
                        · {{ dayjs(date).format('HH:mm') }}
                    </template>
                </p>
            </div>
        </div>

        <p
            v-if="match.location"
            class="text-primary-700 mb-0 flex items-start gap-2 text-sm font-semibold"
        >
            <UIcon
                class="text-primary-400 mt-0.5 size-4 shrink-0"
                name="i-lucide-map-pin"
            />
            {{ match.location }}
        </p>

        <div class="flex flex-wrap items-center gap-2">
            <UBadge
                color="neutral"
                icon="i-lucide-users"
                :label="t('driving.players', plan.squadSize)"
                variant="subtle"
            />
            <UBadge icon="i-lucide-car" data-testid="driving-cars">
                {{ t('driving.cars', plan.cars.length) }}
                <template v-if="plan.cars.length > plan.needed">
                    {{
                        t('driving.extraCount', {
                            count: plan.cars.length - plan.needed,
                        })
                    }}
                </template>
            </UBadge>
        </div>

        <ul
            class="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3"
        >
            <li
                v-for="(car, index) in plan.cars"
                :key="index"
                class="flex min-h-14 items-center gap-3 rounded-xl border py-1 pr-1 pl-3"
                :class="[
                    !car.playerId
                        ? 'border-dashed border-amber-600 bg-amber-50 text-amber-800'
                        : car.extraIndex === null
                          ? 'border-primary-200 bg-primary-50'
                          : 'border-primary-300 bg-white',
                ]"
                data-testid="driving-car"
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
                    <p
                        class="text-primary-950 mb-0 truncate font-bold"
                        data-testid="driver-name"
                    >
                        {{ nameOf(car.playerId) }}
                    </p>
                    <p
                        class="text-primary-600 mb-0 flex items-center gap-1 text-xs"
                    >
                        <UIcon
                            v-if="car.picked"
                            class="text-teal-700"
                            name="i-lucide-pin"
                        />
                        <UIcon
                            v-else-if="car.alwaysDrives"
                            class="text-amber-700"
                            name="i-lucide-star"
                        />
                        {{ carLabel(car) }}
                    </p>
                </div>
                <span v-else class="flex-1 text-sm font-semibold">
                    {{ t('driving.driverNeeded') }}
                </span>

                <UButton
                    v-if="editable && (car.playerId || car.extraIndex !== null)"
                    :aria-label="
                        car.extraIndex === null
                            ? t('driving.cannotDriveLabel', {
                                  name: nameOf(car.playerId as string),
                              })
                            : t('driving.removeExtraCar')
                    "
                    color="neutral"
                    icon="i-lucide-x"
                    size="lg"
                    variant="ghost"
                    @click="removeCar(car)"
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
            @click="emit('addCar')"
        />
    </article>
</template>
