<script lang="ts" setup>
const version = __APP_VERSION__
</script>

<template>
  <footer class="footer-root py-6 text-white mt-12">
    <div class="container flex justify-between text-xs">
      <div class="text-white/60">Voetbal stats - {{ version }}</div>
      <div class="text-right">
        <a
          href="https://github.com/savonije"
          target="_blank"
          class="text-white/60 hover:text-white transition-colors duration-200"
        >
          &copy; Kevin Savonije
        </a>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer-root {
  background: linear-gradient(135deg, #4067b9 0%, #27428a 40%, #1d2e5d 70%, #111a36 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 -4px 24px rgba(17, 26, 54, 0.3);
}
</style>
