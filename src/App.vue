<script setup lang="ts">
    import { onMounted } from 'vue';
    import { RouterView } from 'vue-router';

    import { useStoreAuth } from '@/stores/storeAuth';

    const storeAuth = useStoreAuth();

    onMounted(() => {
        storeAuth.init();
    });
</script>

<template>
    <RouterView />
</template>
