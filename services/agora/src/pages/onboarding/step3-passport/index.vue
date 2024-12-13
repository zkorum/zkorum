<template>
  <div>
    <StepperLayout :submit-call-back="() => { }" :current-step="3" :total-steps="6" :enable-next-button="true"
      :show-next-button="false">
      <template #header>
        <InfoHeader title="Own Your Privacy" :description="description" icon-name="mdi-wallet" />
      </template>

      <template #body>
        <ZKCard padding="1.5rem">
          <div class="stepContainer">
            <div class="stepFlex">
              <q-icon name="mdi-numeric-1" size="2rem" class="numberCircle" />
              Download
              <div v-if="quasar.platform.is.mobile">
                <a :href="rarimeStoreLink" target="_blank" rel="noopener noreferrer">RariMe</a>
              </div>
              <div v-else>RariMe on your phone by scanning the QR code</div>
            </div>

            <div class="stepFlex">
              <q-icon name="mdi-numeric-2" size="2rem" class="numberCircle" />
              Claim your anonymous ID on RariMe
            </div>
            <div class="stepFlex">
              <q-icon name="mdi-numeric-3" size="2rem" class="numberCircle" />
              <div v-if="quasar.platform.is.mobile">
                Come back here and click verify
              </div>
              <div v-else>
                Scan the QR code with RariMe to verify your identity
              </div>
            </div>

            <div class="innerInstructions">
              <div v-if="!quasar.platform.is.mobile">
                <img v-if="qrcode !== undefined" :src="qrcode" alt="QR Code" class="qrCode" />
                <q-spinner v-if="qrcode === undefined" color="primary" size="3em" class="qrCode" />
                <div>or copy the below link on your mobile:</div>
                <!-- make this copyable -->
                <div>{{ verificationLink }}</div>
              </div>

              <ZKButton v-if="quasar.platform.is.mobile" label="Verify" color="primary"
                @click="clickedVerifyButton()" />
            </div>
          </div>
        </ZKCard>

        <ZKButton label="I'd rather verify with my phone number" text-color="color-text-strong"
          @click="goToPhoneVerification()" />
      </template>
    </StepperLayout>
  </div>
</template>

<script setup lang="ts">
import StepperLayout from "src/components/onboarding/StepperLayout.vue";
import InfoHeader from "src/components/onboarding/InfoHeader.vue";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import { useQuasar } from "quasar";
import { useQRCode } from "@vueuse/integrations/useQRCode.mjs";
import { useRouter } from "vue-router";
import { onMounted, ref } from "vue";
import ZKCard from "src/components/ui-library/ZKCard.vue";
import { useSkipAuth } from "src/utils/auth/skipAuth";
import { useAuthSetup } from "src/utils/auth/setup";
import { DefaultApiAxiosParamCreator, DefaultApiFactory } from "src/api/api";
import { useCommonApi } from "src/utils/api/common";
import { api } from "src/boot/axios";
import { buildAuthorizationHeader } from "src/utils/crypto/ucan/operation";
import { useNotify } from "src/utils/ui/notify";
import { onUnmounted } from "vue";

const description =
  "RariMe is a ZK-powered identity wallet that converts your passport into an anonymous digital ID, stored on your device, so you can prove that you’re a unique human without sharing any personal data with anyone.";

const quasar = useQuasar();

const router = useRouter();

const { buildEncodedUcan } = useCommonApi();
const { showNotifyMessage } = useNotify();

const isDidLoggedInIntervalId = ref(undefined);
const verificationLink = ref("");

onMounted(async () => {
  isDidLoggedInIntervalId.value = setInterval(isDidLoggedIn, 2000);
  try {
    const { url, options } =
      await DefaultApiAxiosParamCreator().apiV1RarimoGenerateVerificationLinkPost();
    const encodedUcan = await buildEncodedUcan(url, options);
    const response = await DefaultApiFactory(
      undefined,
      undefined,
      api
    ).apiV1RarimoGenerateVerificationLinkPost({
      headers: {
        ...buildAuthorizationHeader(encodedUcan),
      },
    });
    verificationLink.value = response.data.verificationLink;
    qrcode.value = useQRCode(response.data.verificationLink);
  } catch (e) {
    console.error(e);
    showNotifyMessage(
      "Failed to fetch RariMe verification link: try refreshing the page"
    );
  }
});

onUnmounted(() => {
  if (isDidLoggedInIntervalId.value !== undefined) {
    clearInterval(isDidLoggedInIntervalId.value);
  }
});

async function isDidLoggedIn() {
  try {
    const { url, options } =
      await DefaultApiAxiosParamCreator().apiV1RarimoVerifyUserStatusAndAuthenticatePost();
    const encodedUcan = await buildEncodedUcan(url, options);
    const response = await DefaultApiFactory(
      undefined,
      undefined,
      api
    ).apiV1RarimoVerifyUserStatusAndAuthenticatePost({
      headers: {
        ...buildAuthorizationHeader(encodedUcan),
      },
    });
    if (response.data.rarimoStatus === "verified") {
      await completeVerification();
    }
  } catch (e) {
    console.error(e);
    showNotifyMessage(
      "Failed to verify identity proof: are you connected to internet? if yes contact Agora team"
    );
  }
}

const qrcode = ref(undefined);
const { userLogin } = useAuthSetup();

const { skipEverything } = useSkipAuth();

const rarimeStoreLink = ref("");

if (quasar.platform.is.android) {
  rarimeStoreLink.value =
    "https://play.google.com/store/apps/details?id=com.rarilabs.rarime";
} else if (quasar.platform.is.ios) {
  rarimeStoreLink.value = "https://apps.apple.com/us/app/rarime/id6503300598";
} else {
  rarimeStoreLink.value = "https://rarime.com/";
}

async function clickedVerifyButton() {
  const result = await skipEverything();
  if (result) {
    await userLogin();
    router.push({ name: "onboarding-step4-username" });
  }
}

async function completeVerification() {
  clearInterval(isDidLoggedInIntervalId.value);
  showNotifyMessage("Verification successful 🎉");
  await userLogin();
  router.push({ name: "onboarding-step4-username" });
}

function goToPhoneVerification() {
  router.push({ name: "onboarding-step3-phone-1" });
}
</script>

<style scoped lang="scss">
.stepContainer {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  justify-content: center;
}

.stepFlex {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.innerInstructions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.numberCircle {
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  background: #fff;
  border: 2px solid black;
  color: black;
  text-align: center;
}
</style>
