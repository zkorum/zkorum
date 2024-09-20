<template>
  <div>
    <AuthContentWrapper>
      <template #title>
        Instructions
      </template>
      <template #body>

        <div class="container">
          <div>
            With RariMe, you can prove your identity anonymously!
            This step is essential to protect your privacy and security on Agora.
          </div>

          <ZKCard padding="1rem">
            <div class="stepContainer">
              <div class="stepFlex">
                <q-icon name="mdi-numeric-1" size="2rem" class="numberCircle" />
                Click on the button to download or open RariMe app
              </div>
              <div class="stepFlex">
                <q-icon name="mdi-numeric-2" size="2rem" class="numberCircle" />
                Scan your passport with privacy
              </div>
              <div class="stepFlex">
                <q-icon name="mdi-numeric-3" size="2rem" class="numberCircle" />
                Get automatically redirected to Agora
              </div>
            </div>
          </ZKCard>

          <a href="https://rarime.com/" target="_blank">
            <ZKButton label="Go to RariMe" color="primary" :style="{ width: '100%' }" />
          </a>

          <SkipForLaterButton @click="skipButton()" />
        </div>

      </template>
    </AuthContentWrapper>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import AuthContentWrapper from "src/components/authentication/AuthContentWrapper.vue";
import ZKCard from "src/components/ui-library/ZKCard.vue";
import SkipForLaterButton from "src/components/authentication/SkipForLaterButton.vue";

const router = useRouter();

function skipButton() {
  router.push({ name: "default-home-feed" });
}

</script>

<style scoped lang="scss">

.container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stepFlex {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: $color-text-weak;
}

.numberCircle {
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  background: #fff;
  border: 2px solid #666;
  color: #666;
  text-align: center;
}

.stepContainer {
  display:flex;
  flex-direction: column;
  gap: 1.5rem;
  justify-content: center;
}

</style>
