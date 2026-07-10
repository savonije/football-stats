<script lang="ts" setup>
    const version = __APP_VERSION__;
</script>

<template>
    <footer class="footer-root mt-12 py-6 text-white">
        <div class="container flex justify-between text-xs">
            <div class="text-white/60">Voetbal stats - {{ version }}</div>
            <div class="text-right">
                <a
                    class="text-white/60 transition-colors duration-200 hover:text-white"
                    href="https://github.com/savonije"
                    target="_blank"
                >
                    &copy; Kevin Savonije
                </a>
            </div>
        </div>
    </footer>
</template>

<style scoped>
    .footer-root {
        background: linear-gradient(
            135deg,
            var(--color-primary-500) 0%,
            var(--color-primary-700) 40%,
            var(--color-primary-900) 70%,
            var(--color-primary-950) 100%
        );
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 -4px 24px rgba(17, 26, 54, 0.3);
    }
</style>
