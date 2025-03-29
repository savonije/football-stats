<script lang="ts" setup>
    import { computed, onMounted, ref, watch } from 'vue';
    import { useRoute } from 'vue-router';

    import Loader from '@/components/Loader.vue';

    import { useDebounce } from '@/composables/useDebounce';
    import { useStoreGames } from '@/stores/storeGames';

    const StoreGames = useStoreGames();
    const route = useRoute();
    const isDataLoading = ref(true);

    const id = computed(() => route.params.id as string);

    const gameDetails = computed(
        () => StoreGames.Games.find((game) => game.id === id.value) || null,
    );

    const debouncedGoalsFor = useDebounce(
        computed(() => gameDetails.value?.goals_for),
        500,
    );
    const debouncedGoalsAgainst = useDebounce(
        computed(() => gameDetails.value?.goals_against),
        500,
    );

    watch(debouncedGoalsFor, (newValue, oldValue) => {
        if (newValue !== oldValue && gameDetails.value) {
            StoreGames.updateGame(gameDetails.value.id, {
                goals_for: newValue,
            });
        }
    });

    watch(debouncedGoalsAgainst, (newValue, oldValue) => {
        if (newValue !== oldValue && gameDetails.value) {
            StoreGames.updateGame(gameDetails.value.id, {
                goals_against: newValue,
            });
        }
    });

    onMounted(() => {
        isDataLoading.value = !StoreGames.Games.length;

        if (!StoreGames.Games.length) {
            StoreGames.getGames();
        }
    });
</script>

<template>
    <div v-if="gameDetails" class="mx-auto flex w-[550px] justify-center gap-9">
        <div>
            <h2>Apollo</h2>
            <div class="text-center text-5xl font-bold">
                <input
                    v-model="gameDetails.goals_for"
                    class="bg-shark-300 w-20 rounded-sm text-center"
                    type="number"
                    min="0"
                    max="40"
                />
            </div>
            <div class="mt-9">Spelers...</div>
        </div>
        <div>
            <h2>{{ gameDetails?.opponent ?? 'Tegenstander' }}</h2>
            <div class="text-center text-5xl font-bold">
                <input
                    v-model="gameDetails.goals_against"
                    class="bg-shark-300 w-20 rounded-sm text-center"
                    type="number"
                    min="0"
                    max="40"
                />
            </div>
        </div>
    </div>

    <div v-else>
        <Loader />
        <p>Wedstrijd gegevens laden...</p>
    </div>
</template>
