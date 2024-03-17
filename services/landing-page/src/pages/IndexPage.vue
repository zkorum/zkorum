<template>
  <q-page class="width-max">
    <div class="column justify-start items-start">
      <div class="row width-100">
        <div
          class="column justify-start items-start bg-brand first-intro q-pa-md width-half"
        >
          <q-img
            class="q-my-lg"
            src="logo.png"
            style="max-width: 280px"
            srcset="logo.png 70w,
                logo.png 139w,
                logo.png 278w"
            sizes="(max-width: 140px) 70w,
              (min-width: 140px) and (max-width: 279px) 139w,
              (min-width: 280px) and (max-width: 556px) 279w,
              (min-width: 556px) 279w"
          />
          <div class="q-my-lg col-auto">
            <h1 class="motto">Anonymous Space<br />For Honest Conversations</h1>
          </div>
          <div class="q-my-lg col-auto width-25">
            <q-btn
              class="full-width"
              rounded
              no-caps
              unelevated
              icon-right="trending_flat"
              color="brand-teal"
              :size="buttonSize"
              text-color="brand-dark"
              label="Go to Feed"
            />
          </div>
        </div>
        <div class="column justify-center items-center width-half">
          <q-img
            :src="shownImage"
            style="max-width: 360px"
            :srcset="
              (shownImage + ' 135w', shownImage + ' 270w', shownImage + ' 360w')
            "
            sizes="(max-width: 140px) 135w,
              (min-width: 140px) and (max-width: 279px) 270w,
              (min-width: 280px) and (max-width: 556px) 360w,
              (min-width: 556px) 360w"
          />
        </div>
      </div>
      <q-separator class="width-100 bg-brand" />
      <div>
        <div class="row justify-around items-start">
          <div>
            <q-card flat class="text-center">
              <q-card-section>
                <q-avatar
                  size="100px"
                  color="brand"
                  text-color="white"
                  icon="bi-incognito"
                />
                <p class="text-h4">Anonymous</p>
                <p class="text-body1 width-explanation">
                  The origin of your posts is encrypted on your device; even we
                  can't track who says what on ZKorum's backend. #ZKP
                </p>
              </q-card-section>
            </q-card>
          </div>
          <div>
            <q-card flat class="text-center">
              <q-card-section>
                <q-avatar
                  size="100px"
                  color="brand"
                  text-color="white"
                  icon="bi-person-check"
                />
                <p class="text-h4">Verifiable</p>
                <p class="text-body1 width-explanation">
                  All users are verified by a professional/school email address
                  or a W3C Verifiable Credential. #SSI
                </p>
              </q-card-section>
            </q-card>
          </div>
          <div>
            <q-card flat class="text-center">
              <q-card-section>
                <q-avatar
                  size="100px"
                  color="brand"
                  text-color="white"
                  icon="bi-robot"
                />
                <p class="text-h4">Non-toxic</p>
                <p class="text-body1 width-explanation">
                  Learn to disagree respectfully and keep this space supportive
                  by interacting with ShelBot, our fine-tuned Mistal LLM. #AI
                  #Gamification
                </p>
              </q-card-section>
            </q-card>
          </div>
          <div>
            <q-card flat class="text-center">
              <q-card-section>
                <q-avatar
                  size="100px"
                  color="brand"
                  text-color="white"
                  icon="bi-vignette"
                />
                <p class="text-h4">Auditable moderation</p>
                <p class="text-body1 width-explanation">
                  Every proof of posts are broardcast on a permisionless
                  peer-to-peer network, building moderation accountability.
                  Don't Trust, Verify! #DWeb
                </p>
              </q-card-section>
            </q-card>
          </div>
          <div>
            <q-card flat class="text-center">
              <q-card-section>
                <q-avatar
                  size="100px"
                  color="brand"
                  text-color="white"
                  icon="bi-code-slash"
                />
                <p class="text-h4">Open-Source</p>
                <p class="text-body1 width-explanation">
                  Anyone can verify our source-code is doing what we say it
                  does, building transparency, and providing better
                  interoperability and security. #OSS
                </p>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </div>
    <!-- <example-component -->
    <!--   title="Example component" -->
    <!--   active -->
    <!--   :todos="todos" -->
    <!--   :meta="meta" -->
    <!-- ></example-component> -->
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, onMounted, ref } from 'vue';

const $q = useQuasar();
const buttonSize = computed(() => {
  return $q.screen.lt.md ? 'lg' : 'xl';
});

const images = ['1-cropped.png', '2-cropped.png', '3-cropped.png'];

const shownImage = ref(images[0]);
const indexShownImage = ref(0);

onMounted(() => {
  setInterval(function () {
    if (indexShownImage.value < 2) {
      const newIndex = indexShownImage.value + 1;
      shownImage.value = images[newIndex];
      indexShownImage.value = newIndex;
    } else {
      const newIndex = 0;
      shownImage.value = images[0];
      indexShownImage.value = newIndex;
    }
  }, 4000);
});
</script>

<style lang="scss">
@import 'node_modules/quasar/src/css/core/typography.sass';
.motto {
  body.screen--xs & {
    @extend .text-h5;
  }
  body.screen--sm & {
    @extend .text-h4;
  }
  body.screen--md & {
    @extend .text-h4;
  }
  body.screen--lg & {
    @extend .text-h3;
  }
  body.screen--xl & {
    @extend .text-h2;
  }
}
.width-max {
  width: 100vw;
}
.width-100 {
  width: 100%;
}
.logo {
  max-width: 427px;
}
.center {
  margin-top: auto;
  margin-bottom: auto;
}
.width-explanation {
  max-width: 400px;
}
.first-intro {
  height: 650px;
  color: white;
}
.width-half {
  width: 50%;
}
.width-25 {
  min-width: 33%;
}
</style>
