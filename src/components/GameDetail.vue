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
    <div v-if="gameDetails" class="mx-auto flex w-[550px] justify-center gap-9">
        <div>
            <h2>Apollo</h2>
            <div class="text-center text-5xl font-bold">
                {{ gameDetails.goals_for }}
            </div>
            <div class="mt-9">Spelers...</div>
        </div>
        <div>
            <h2>{{ gameDetails?.opponent ?? 'Tegenstander' }}</h2>
            <div class="text-center text-5xl font-bold">
                {{ gameDetails.goals_against }}
            </div>
        </div>
    </div>

    <div v-else>
        <Loader />
        <p>Wedstrijd gegevens laden...</p>
    </div>
</template>
