<script lang="ts" setup>
const version = __APP_VERSION__
</script>

<template>
  <footer class="py-6 bg-primary text-white">
    <div class="container flex justify-between text-xs">
      <div>Voetbal stats - {{ version }}</div>
      <div class="text-right">
        <a href="https://github.com/savonije" target="_blank"> &copy; Kevin Savonije </a>
      </div>
    </div>
  </footer>
</template>
