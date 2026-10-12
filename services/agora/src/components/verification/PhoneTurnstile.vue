<template>
  <TurnstileChallenge
    ref="challenge"
    :action="PHONE_SMS_TURNSTILE_ACTION"
    @token-ready="emit('tokenReady')"
  />
</template>

<script setup lang="ts">
import { PHONE_SMS_TURNSTILE_ACTION } from "src/shared/types/turnstile";
import { ref } from "vue";

import TurnstileChallenge from "./TurnstileChallenge.vue";

const emit = defineEmits<{ tokenReady: [] }>();
const challenge = ref<InstanceType<typeof TurnstileChallenge>>();
function takeToken(): string | undefined {
  return challenge.value?.takeToken();
}
defineExpose({ takeToken });
</script>
