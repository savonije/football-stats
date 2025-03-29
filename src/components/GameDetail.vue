<script lang="ts" setup>
    import { storeToRefs } from 'pinia';
    import { computed, onMounted, ref, watch } from 'vue';
    import { useRoute } from 'vue-router';

    import Loader from '@/components/Loader.vue';

    import { useDebounce } from '@/composables/useDebounce';
    import { useStoreGames } from '@/stores/storeGames';
    import { useStorePlayers } from '@/stores/storePlayers';

    const StoreGames = useStoreGames();
    const route = useRoute();
    const isDataLoading = ref(true);

    const playersStore = useStorePlayers();
    const { players } = storeToRefs(playersStore);

    console.log(players.value);

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

    onMounted(async () => {
        isDataLoading.value = StoreGames.Games.length === 0;

        await Promise.all([
            playersStore.getPlayers(),
            StoreGames.Games.length === 0
                ? StoreGames.getGames()
                : Promise.resolve(),
        ]);
    });
</script>

<template>
    <div v-if="gameDetails" class="mx-auto flex w-[550px] justify-center gap-9">
        <div class="w-[400px] text-center">
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
            <div class="mt-9">
                <ul>
                    <li v-for="(player, index) in players" :key="player.name">
                        <strong>{{ index + 1 }}.</strong> {{ player.name }}
                    </li>
                </ul>
            </div>
        </div>
        <div class="w-[400px] text-center">
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
