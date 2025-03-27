<script lang="ts" setup>
import AddGame from '@/components/AddGame.vue';
</script>

<template>
    <div class="mb-9 flex items-center justify-between gap-3">
        <h1 class="mb-0">Wedstrijden</h1>

        <AddGame />
    </div>

    <div class="flex flex-col gap-4">
        <div
            class="bg-shark-50 flex items-center justify-center gap-3 rounded-md p-4 shadow-xs"
        >
            <div>Tegenstander</div>
            <div class="bg-shark-200 rounded-sm p-2 font-bold">0 - 1</div>
            <div>Apollo</div>
        </div>
    </div>
</template>
