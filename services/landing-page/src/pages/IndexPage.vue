<template>
  <q-page class="width-max">
    <div class="column justify-start items-start">
      <div class="row width-100">
        <div
          class="column justify-start items-start bg-brand first-intro q-pa-md col-grow"
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
              no-wrap
              unelevated
              icon-right="trending_flat"
              color="brand-teal"
              :size="buttonSize"
              text-color="brand-dark"
              label="Go to Feed"
              href="https://zkorum.com/feed/"
              target="_blank"
            />
          </div>
        </div>
        <div
          class="column justify-center items-center col-grow"
          style="max-width: 100%; min-width: 50%"
        >
          <q-img
            :src="shownImage"
            style="max-width: 440px"
            :srcset="
              (shownImage + ' 270w', shownImage + ' 360w', shownImage + ' 432w')
            "
            sizes="(max-width: 279px) 270w,
              (min-width: 280px) and (max-width: 369px) 360w,
              (min-width: 370px) and (max-width: 556px) 432w,
              (min-width: 557px) 432w"
          />
        </div>
      </div>
      <q-separator class="width-100 bg-brand" />
      <div class="width-100">
        <div class="row justify-around items-center">
          <div class="row flex-center col-xs-12 col-md-6 col-lg-4 col-xl-4">
            <q-card flat class="text-center" style="max-width: 400px">
              <q-card-section>
                <q-avatar
                  size="100px"
                  color="brand"
                  text-color="white"
                  icon="bi-incognito"
                />
                <p class="text-h4 q-mt-xs">Anonymous</p>
                <p class="text-body1 text-justify">
                  The origin of your posts is encrypted on your device; even we
                  can't track who says what on ZKorum's backend. #ZKP
                </p>
              </q-card-section>
            </q-card>
          </div>
          <div class="row flex-center col-xs-12 col-md-6 col-lg-4 col-xl-4">
            <q-card flat class="text-center" style="max-width: 400px">
              <q-card-section>
                <q-avatar
                  size="100px"
                  color="brand"
                  text-color="white"
                  icon="bi-person-check"
                />
                <p class="text-h4 q-mt-xs">Verifiable</p>
                <p class="text-body1 text-justify">
                  All users are verified by a professional/school email address
                  or a W3C Verifiable Credential. #SSI
                </p>
              </q-card-section>
            </q-card>
          </div>
          <div class="row flex-center col-xs-12 col-md-6 col-lg-4 col-xl-4">
            <q-card flat class="text-center" style="max-width: 400px">
              <q-card-section>
                <q-avatar
                  size="100px"
                  color="brand"
                  text-color="white"
                  icon="bi-robot"
                />
                <p class="text-h4 q-mt-xs">Non-toxic</p>
                <p class="text-body1 text-justify">
                  Learn to disagree respectfully and keep this space supportive
                  by interacting with ShelBot, our fine-tuned Mistral LLM. #AI
                  #Gamification
                </p>
              </q-card-section>
            </q-card>
          </div>
          <div class="row flex-center col-xs-12 col-md-6 col-lg-4 col-xl-4">
            <q-card flat class="text-center" style="max-width: 400px">
              <q-card-section>
                <q-avatar
                  size="100px"
                  color="brand"
                  text-color="white"
                  icon="bi-vignette"
                />
                <p class="text-h4 q-mt-xs">Auditable</p>
                <p class="text-body1 text-justify">
                  Every proof of posts are broadcast on a permisionless
                  peer-to-peer network, building moderation accountability.
                  Don't Trust, Verify! #DWeb
                </p>
              </q-card-section>
            </q-card>
          </div>
          <div class="row flex-center col-xs-12 col-md-6 col-lg-4 col-xl-4">
            <q-card flat class="text-center" style="max-width: 400px">
              <q-card-section>
                <q-avatar
                  size="100px"
                  color="brand"
                  text-color="white"
                  icon="bi-code-slash"
                />
                <p class="text-h4 q-mt-xs">Open-source</p>
                <p class="text-body1 text-justify">
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
    <div class="column flex-center bg-brand-teal width-100">
      <div class="row items-center justify-around">
        <q-btn
          class="text-h6 col-xs-6 col-sm-6 col-md-3 col-lg-3 col-xl-3"
          unelevated
          flat
          rounded
          outline
          no-caps
          type="a"
          href="https://www.notion.so/zkorum/Legal-notice-90ddbd5ebddc48de93512241a6157095"
          target="_blank"
          text-color="brand"
          >Legal</q-btn
        >
        <q-btn
          class="text-h6 col-xs-6 col-sm-6 col-md-3 col-lg-3 col-xl-3"
          unelevated
          flat
          rounded
          outline
          no-caps
          type="a"
          href="https://www.notion.so/zkorum/Privacy-policy-ac5d0d7c91f142e481daa8f826b0e2b2"
          target="_blank"
          text-color="brand"
          >Privacy</q-btn
        >
        <q-btn
          class="text-no-wrap text-h6 col-xs-6 col-sm-6 col-md-3 col-lg-3 col-xl-3"
          unelevated
          flat
          rounded
          outline
          no-caps
          type="a"
          href="https://www.notion.so/zkorum/Terms-of-service-c37b34e934c240878b7d5af53888e72c"
          target="_blank"
          text-color="brand"
          >Terms</q-btn
        >
        <q-btn
          class="text-h6 col-xs-6 col-sm-6 col-md-3 col-lg-3 col-xl-3"
          unelevated
          flat
          rounded
          outline
          no-caps
          type="a"
          href="https://about.zkorum.com"
          target="_blank"
          text-color="brand"
          >About</q-btn
        >
      </div>
      <div class="row flex-center">
        <q-btn
          text-color="brand"
          unelevated
          flat
          rounded
          outline
          no-caps
          type="a"
          href="https://www.instagram.com/zkorum/"
          target="_blank"
          icon="bi-instagram"
        />
        <q-btn
          text-color="brand"
          unelevated
          flat
          rounded
          outline
          no-caps
          href="https://www.linkedin.com/company/zkorum/"
          target="_blank"
          icon="bi-linkedin"
        />
        <q-btn
          text-color="brand"
          unelevated
          flat
          rounded
          outline
          no-caps
          type="a"
          href="https://github.com/zkorum/zkorum"
          target="_blank"
          icon="bi-github"
        />
        <q-btn
          text-color="brand"
          unelevated
          flat
          rounded
          outline
          no-caps
          type="a"
          href="https://discord.gg/cAkAJQSTEU"
          target="_blank"
          icon="bi-discord"
        />
      </div>
      <div class="text-brand row flex-center">
        <div class="text-center text-body1 q-pt-md q-pb-sm">
          © ZKorum SAS 2024
        </div>
      </div>
      <div class="text-brand row flex-center">
        <div class="text-center text-body1 q-pb-sm">Made with ❤️ in Paris</div>
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

const images = ['1.png', '2.png', '3.png'];

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
    @extend .text-h4;
  }
  body.screen--sm & {
    @extend .text-h4;
  }
  body.screen--md & {
    @extend .text-h3;
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
.first-intro {
  max-height: 750px;
  color: white;
}
.width-25 {
  min-width: 33%;
}
</style>
