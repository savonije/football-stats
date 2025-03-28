<script lang="ts" setup>
    import { storeToRefs } from 'pinia';
    import { onMounted, ref } from 'vue';

    import AddPlayer from '@/components/AddPlayer.vue';

    import { useStorePlayers } from '@/stores/storePlayers';

    const playersStore = useStorePlayers();
    const { players } = storeToRefs(playersStore);

    const isLoading = ref(true);

    onMounted(async () => {
        await playersStore.getPlayers();
        isLoading.value = false;
    });
</script>

<template>
    <div class="mb-9 flex items-center justify-between gap-3">
        <h1>Spelers</h1>

        <AddPlayer />
    </div>

    <div v-if="isLoading">Spelers data wordt geladen...</div>
    <ul v-else class="grid grid-cols-3 gap-3">
        <li
            v-for="player in players"
            :key="player.name"
            class="bg-shark-50 rounded-md p-4 text-center font-bold shadow-sm"
        >
            {{ player.name }}
        </li>
    </ul>
</template>
