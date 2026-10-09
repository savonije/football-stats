<script setup lang="ts">
    import { usePreferredReducedMotion } from '@vueuse/core';

    const reducedMotion = usePreferredReducedMotion();

    const animate = async (
        el: Element,
        keyframes: Keyframe[],
        options: KeyframeAnimationOptions,
        done: () => void,
    ) => {
        if (reducedMotion.value !== 'reduce') {
            await el.animate(keyframes, options).finished;
        }
        done();
    };

    const onLeave = (el: Element, done: () => void) =>
        animate(
            el,
            [
                { opacity: 1, transform: 'none', filter: 'blur(0)' },
                {
                    opacity: 0,
                    transform: 'translateY(-12px) scale(0.99)',
                    filter: 'blur(6px)',
                },
            ],
            {
                duration: 450,
                easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
                fill: 'forwards',
            },
            done,
        );

    const onEnter = (el: Element, done: () => void) =>
        animate(
            el,
            [
                {
                    opacity: 0,
                    transform: 'translateY(20px) scale(0.98)',
                    filter: 'blur(8px)',
                },
                { opacity: 1, transform: 'none', filter: 'blur(0)' },
            ],
            { duration: 600, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
            done,
        );
</script>

<template>
    <Transition mode="out-in" :css="false" @enter="onEnter" @leave="onLeave">
        <slot />
    </Transition>
</template>
