<script lang="ts" setup>
    import { storeToRefs } from 'pinia';
    import { onMounted } from 'vue';

    import AddGame from '@/components/AddGame.vue';

    import { useStoreGames } from '@/stores/storeGames';

    const gamesStore = useStoreGames();
    const { Games } = storeToRefs(gamesStore);

    onMounted(() => {
        gamesStore.getGames();
    });
</script>

<template>
    <div class="mb-9 flex items-center justify-between gap-3">
        <h1 class="mb-0">Wedstrijden</h1>
        <AddGame />
    </div>

    <div class="flex flex-col gap-4">
        <router-link
            v-for="game in Games"
            :key="game.id"
            class="bg-shark-50 hover:bg-shark-100 flex cursor-pointer items-center justify-center gap-3 rounded-md p-4 shadow-xs"
            :to="{ name: 'detail', params: { id: game.id } }"
        >
            <div>{{ game.opponent }}</div>
            <div class="bg-shark-200 rounded-sm p-2 font-bold">
                {{ game.goals_for }} - {{ game.goals_against }}
            </div>
            <div>Apollo</div>
        </router-link>
    </div>
</template>
