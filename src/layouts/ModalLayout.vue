<script lang="ts" setup>
    import { onClickOutside } from '@vueuse/core';
    import { onBeforeUnmount, onMounted, ref } from 'vue';

    defineProps({
        showModal: Boolean,
    });
    const emit = defineEmits(['close']);

    const modalRef = ref(null);

    onClickOutside(modalRef, () => {
        emit('close');
    });

    const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            emit('close');
        }
    };

    onMounted(() => {
        window.addEventListener('keydown', handleEscape);
    });

    onBeforeUnmount(() => {
        window.removeEventListener('keydown', handleEscape);
    });

    defineSlots<{
        default: () => unknown;
    }>();
</script>

<template>
    <div
        v-if="showModal"
        class="bg-black-700/75 fixed top-0 left-0 z-10 flex h-full w-full items-center justify-center"
    >
        <div
            ref="modalRef"
            class="w-[95%] rounded-sm bg-white p-9 text-black shadow-sm sm:max-w-[500px] dark:bg-gray-950 dark:text-white"
        >
            <slot />
        </div>
    </div>
</template>
