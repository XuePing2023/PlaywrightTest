<script setup lang="ts">
import { useServiceWorkerUpdate } from '../serviceWorker'

const { updateReady, applyUpdate } = useServiceWorkerUpdate()
</script>

<template>
  <div v-if="updateReady" class="reload-prompt" role="status">
    <span>A new version is available.</span>
    <button type="button" @click="applyUpdate">Refresh</button>
  </div>
</template>

<style scoped>
.reload-prompt {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem 1rem;
  color: var(--color-text);
  background: var(--color-background-soft);
  border: 1px solid var(--color-border-hover);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
}

button {
  padding: 0.25rem 0.75rem;
  color: var(--color-background);
  background: var(--color-text);
  border: 0;
  border-radius: 4px;
  cursor: pointer;
}
</style>
