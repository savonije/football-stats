<script lang="ts" setup>
    import { computed, onMounted, ref } from 'vue';
    import { useRoute } from 'vue-router';

    import Loader from '@/components/Loader.vue';

    import { useStoreGames } from '@/stores/storeGames';

    const StoreGames = useStoreGames();
    const route = useRoute();
    const isDataLoading = ref(true);

    const id = computed(() => route.params.id as string);

    const gameDetails = computed(
        () => StoreGames.Games.find((game) => game.id === id.value) || null,
    );

    onMounted(() => {
        isDataLoading.value = !StoreGames.Games.length;

        if (!StoreGames.Games.length) {
            StoreGames.getGames();
        }
    });
</script>

<template>
    <h1>{{ gameDetails?.opponent ?? 'Tegenstander' }} - Apollo</h1>

    <div v-if="gameDetails">
        <div class="text-xl font-bold">
            {{ gameDetails.goals_against }} - {{ gameDetails.goals_for }}
        </div>

        <div>⚽️ - Ryan</div>
        <div>⚽️ - Ryan</div>
        <div>⚽️ - Ryan</div>
    </div>
    <div v-else>
        <Loader />
        <p>Wedstrijd gegevens laden...</p>
    </div>
</template>
