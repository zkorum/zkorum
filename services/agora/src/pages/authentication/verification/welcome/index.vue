<template>
  <div>
    <AuthContentWrapper>
      <template #title>
        Welcome to Agora!
      </template>
      <template #body>

        <div class="container">
          <RouterLink :to="{ name: 'verification-instructions' }">
            <ZKCard padding="1rem">
              <div class="cardOption">
                <q-icon name="mdi-card-account-details" size="3rem" color="primary" />
                <div class="cardDiv">
                  <div class="cardTitle">
                    Verify your identity
                  </div>

                  <div>
                    Verify your identity with RariMe to unlock Agora's functionalities
                  </div>
                </div>
                <q-icon name="mdi-arrow-right" size="2rem" />
              </div>
            </ZKCard>
          </RouterLink>
          <SkipForLaterButton @click="skipButton()" />
        </div>

      </template>
    </AuthContentWrapper>

  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import AuthContentWrapper from "src/components/authentication/AuthContentWrapper.vue";
import ZKCard from "src/components/ui-library/ZKCard.vue";
import SkipForLaterButton from "src/components/authentication/SkipForLaterButton.vue";

const router = useRouter();

function skipButton() {
  router.push({ name: "default-home-feed" });
}

</script>

<style scoped lang="scss">
.cardOption {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: space-around;
  align-items: center;
}

.cardTitle {
  font-weight: bold;
}

.cardDiv {
  display:flex;
  flex-direction: column;
  gap: 1rem;
  width: min(100%, 12rem);
}

.container {
  display:flex;
  flex-direction: column;
  gap: 2rem;
}

</style>
