<template>
  <div>
    <AuthContentWrapper>
      <template #title>
        Passport Verification
      </template>
      <template #body>

        <div class="container">
          <div>
            With RariMe, you can prove your identity anonymously.
            This step is essential to protect your privacy and security on Agora.
          </div>

          <ZKCard padding="1rem">
            <div class="stepContainer">
              <div class="stepFlex">
                <q-icon name="mdi-numeric-1" size="2rem" class="numberCircle" />
                Use the following to download or open RariMe app
              </div>

              <div class="innerInstructions">
                <img v-if="!quasar.platform.is.mobile" :src="qrcode" alt="QR Code" class="qrCode"/>

                <a :href="rarimeLink" target="_blank" rel="noopener noreferrer">
                  <ZKButton label="Open RariMe" color="primary" :style="{ width: '100%' }"
                    @click="completeVerification()" />
                </a>
              </div>

              <div class="stepFlex">
                <q-icon name="mdi-numeric-2" size="2rem" class="numberCircle" />
                Scan your passport in the RariMe app with privacy
              </div>
              <div class="stepFlex">
                <q-icon name="mdi-numeric-3" size="2rem" class="numberCircle" />
                Get automatically redirected back to Agora
              </div>
            </div>
          </ZKCard>

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
import { useQRCode } from "@vueuse/integrations/useQRCode";
import { useQuasar } from "quasar";
import { ref } from "vue";

const quasar = useQuasar();

const rarimeLink = ref("");
if (quasar.platform.is.android) {
  rarimeLink.value = "https://play.google.com/store/apps/details?id=com.rarilabs.rarime";
} else if (quasar.platform.is.ios) {
  rarimeLink.value = "https://apps.apple.com/us/app/rarime/id6503300598";
} else {
  rarimeLink.value = "https://rarime.com/";
}

const router = useRouter();

const qrcode = useQRCode(rarimeLink, {version: "10"});

function completeVerification() {
  router.push({ name: "verification-successful" });
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

.qrCode {
  width: min(100%, 10rem);
}

.innerInstructions {
  display:flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

</style>
