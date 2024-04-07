<template>
  <q-page class="width-max">
    <div class="column justify-start items-start">
      <div class="row width-100">
        <div class="column justify-start items-start bg-brand first-intro q-pa-md col-grow">
          <div class="row width-100 justify-start items-center">
            <q-img class="q-my-lg q-mr-lg" src="logo.png" style="max-width: 280px" srcset="logo.png 70w,
                logo.png 139w,
                logo.png 278w" sizes="(max-width: 140px) 70w,
              (min-width: 140px) and (max-width: 279px) 139w,
              (min-width: 280px) and (max-width: 556px) 279w,
              (min-width: 556px) 279w" />
            <LanguageSwitcher class="q-mr-lg" style="margin-left: auto;" />
          </div>
          <div class="q-my-lg col-auto">
            <h1 style="white-space: pre-line;" class="motto">{{ $t("title") }}</h1>
            <!-- <h1 style="white-space: pre-line; line-height: 1.5;" class="motto">{{ $t("title.anonymous.pre") }}<strong>{{ -->
            <!--   $t("title.anonymous.bold") }}</strong>{{ $t("title.anonymous.post") }}<br />{{ $t("title.honest.pre") -->
            <!--   }}<strong>{{ -->
            <!--   $t("title.honest.bold") }}</strong>{{ $t("title.honest.post") }}<br />{{ $t("title.verified.pre") -->
            <!--   }}<strong>{{ -->
            <!--   $t("title.verified.bold") }}</strong>{{ $t("title.verified.post") }}</h1> -->
          </div>
          <div class="q-my-lg col-auto min-width-33">
            <q-btn class="full-width" rounded no-caps no-wrap unelevated icon-right="trending_flat" color="brand-teal"
              :size="buttonSize" text-color="brand-dark" :label="$t('goToFeed')" :href="feedUrl" />
          </div>
        </div>
        <div class="column justify-center items-center col-grow" style="max-width: 100%; min-width: 50%">
          <q-img :src="shownImage" style="max-width: 440px" :srcset="(shownImage + ' 270w', shownImage + ' 360w', shownImage + ' 432w')
              " sizes="(max-width: 279px) 270w,
              (min-width: 280px) and (max-width: 369px) 360w,
              (min-width: 370px) and (max-width: 556px) 432w,
              (min-width: 557px) 432w" />
        </div>
      </div>
      <q-separator class="width-100 bg-brand" />
      <div class="width-100">
        <div class="row justify-around items-center">
          <div class="row flex-center col-xs-12 col-md-6 col-lg-4 col-xl-4">
            <q-card flat class="text-center" style="max-width: 400px">
              <q-card-section>
                <q-avatar size="100px" color="brand" text-color="white" icon="bi-incognito" />
                <p class="text-h4 q-mt-xs">{{ $t('anonymous.title') }}</p>
                <p class="text-body1 text-justify">
                  {{ $t('anonymous.description') }}
                </p>
              </q-card-section>
            </q-card>
          </div>
          <div class="row flex-center col-xs-12 col-md-6 col-lg-4 col-xl-4">
            <q-card flat class="text-center" style="max-width: 400px">
              <q-card-section>
                <q-avatar size="100px" color="brand" text-color="white" icon="bi-person-check" />
                <p class="text-h4 q-mt-xs">{{ $t('verifiable.title') }}</p>
                <p class="text-body1 text-justify">
                  {{ $t('verifiable.description') }}
                </p>
              </q-card-section>
            </q-card>
          </div>
          <div class="row flex-center col-xs-12 col-md-6 col-lg-4 col-xl-4">
            <q-card flat class="text-center" style="max-width: 400px">
              <q-card-section>
                <q-avatar size="100px" color="brand" text-color="white" icon="bi-robot" />
                <p class="text-h4 q-mt-xs">{{ $t('nontoxic.title') }}</p>
                <p class="text-body1 text-justify">
                  {{ $t('nontoxic.description') }}
                </p>
              </q-card-section>
            </q-card>
          </div>
          <div class="row flex-center col-xs-12 col-md-6 col-lg-4 col-xl-4">
            <q-card flat class="text-center" style="max-width: 400px">
              <q-card-section>
                <q-avatar size="100px" color="brand" text-color="white" icon="bi-vignette" />
                <p class="text-h4 q-mt-xs">{{ $t('auditable.title') }}</p>
                <p class="text-body1 text-justify">
                  {{ $t('auditable.description') }}
                </p>
              </q-card-section>
            </q-card>
          </div>
          <div class="row flex-center col-xs-12 col-md-6 col-lg-4 col-xl-4">
            <q-card flat class="text-center" style="max-width: 400px">
              <q-card-section>
                <q-avatar size="100px" color="brand" text-color="white" icon="bi-code-slash" />
                <p class="text-h4 q-mt-xs">{{ $t('foss.title') }}</p>
                <p class="text-body1 text-justify">
                  {{ $t('foss.description') }}
                </p>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </div>
    <div class="column flex-center bg-brand-teal width-100">
      <div class="q-my-lg width-between">
        <q-btn class="full-width" rounded no-caps no-wrap unelevated icon-right="trending_flat" color="brand"
          :size="buttonSize" text-color="white" :label="$t('goToFeed')" :href="feedUrl" />
      </div>
      <div class="row items-center justify-around">
        <!-- NOTE: `style="width: fit-content;"` serves to make the button size fits the text size, however it renders the "col" directives useless :/ -->
        <q-btn style="width: fit-content;" class="text-no-wrap text-h6 col-xs-6 col-sm-6 col-md-3 col-lg-3 col-xl-3"
          unelevated flat rounded outline no-caps type="a"
          href="https://www.notion.so/zkorum/Legal-notice-90ddbd5ebddc48de93512241a6157095" target="_blank"
          text-color="brand-dark">{{ $t('legal') }}</q-btn>
        <q-btn style="width: fit-content;" class="text-no-wrap text-h6 col-xs-6 col-sm-6 col-md-3 col-lg-3 col-xl-3"
          unelevated flat rounded outline no-caps type="a"
          href="https://www.notion.so/zkorum/Privacy-policy-ac5d0d7c91f142e481daa8f826b0e2b2" target="_blank"
          text-color="brand-dark">{{ $t('privacy') }}</q-btn>
        <q-btn style="width: fit-content;" class="text-no-wrap text-h6 col-xs-6 col-sm-6 col-md-3 col-lg-3 col-xl-3"
          unelevated flat rounded outline no-caps type="a"
          href="https://www.notion.so/zkorum/Terms-of-service-c37b34e934c240878b7d5af53888e72c" target="_blank"
          text-color="brand-dark">{{ $t('terms') }}</q-btn>
        <q-btn style="width: fit-content;" class="text-no-wrap text-h6 col-xs-6 col-sm-6 col-md-3 col-lg-3 col-xl-3"
          unelevated flat rounded outline no-caps type="a" href="https://about.zkorum.com" target="_blank"
          text-color="brand-dark">{{
              $t('about') }}</q-btn>
      </div>
      <div class="row flex-center">
        <q-btn text-color="brand-dark" unelevated flat rounded outline no-caps type="a"
          href="https://www.instagram.com/zkorum/" target="_blank" icon="bi-instagram" />
        <q-btn text-color="brand-dark" unelevated flat rounded outline no-caps
          href="https://www.linkedin.com/company/zkorum/" target="_blank" icon="bi-linkedin" />
        <q-btn text-color="brand-dark" unelevated flat rounded outline no-caps type="a"
          href="https://github.com/zkorum/zkorum" target="_blank" icon="bi-github" />
        <q-btn text-color="brand-dark" unelevated flat rounded outline no-caps type="a"
          href="https://discord.gg/cAkAJQSTEU" target="_blank" icon="bi-discord" />
      </div>
      <div class="text-brand-dark row flex-center">
        <div class="text-center text-body1 q-pt-md q-pb-sm">
          © ZKorum SAS 2024
        </div>
      </div>
      <div class="text-brand-dark row flex-center">
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
import LanguageSwitcher from 'components/LanguageSwitcher.vue';


const $q = useQuasar();
const buttonSize = computed(() => {
  return $q.screen.lt.md ? 'lg' : 'xl';
});

const images = ['1.png', '2.png', '3.png', '4.png'];

const shownImage = ref(images[0]);
const indexShownImage = ref(0);

const baseUrl = window.location.origin;
const feedUrl = `${baseUrl}/feed/`;

onMounted(() => {
  setInterval(function () {
    if (indexShownImage.value < 3) {
      const newIndex = indexShownImage.value + 1;
      shownImage.value = images[newIndex];
      indexShownImage.value = newIndex;
    } else {
      const newIndex = 0;
      shownImage.value = images[0];
      indexShownImage.value = newIndex;
    }
  }, 5000);
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

.min-width-33 {
  min-width: 33%;
}

.width-between {
  min-width: 16%;
}
</style>
