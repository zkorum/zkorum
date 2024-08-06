<template>
  <q-page class="width-max">
    <div class="column justify-start items-start">
      <div class="column width-100 justify-start items-start bg-brand first-intro q-pa-md col-grow">
        <div class="row width-100 justify-start items-center">
          <q-img class="q-my-lg q-mr-lg" src="logo.png" style="max-width: 280px" srcset="logo.png 70w,
                logo.png 139w,
                logo.png 278w" sizes="(max-width: 140px) 70w,
              (min-width: 140px) and (max-width: 279px) 139w,
              (min-width: 280px) and (max-width: 556px) 279w,
              (min-width: 556px) 279w" />
          <LanguageSwitcher class="q-mr-lg" style="margin-left: auto;" />
        </div>
        <div class="self-center q-my-lg col-auto width-title">
          <h2 style="white-space: pre-line;" class="motto">
            <div v-html="$t('title')"></div>
          </h2>
          <!-- <h1 style="white-space: pre-line; line-height: 1.5;" class="motto">{{ $t("title.anonymous.pre") }}<strong>{{ -->
          <!--   $t("title.anonymous.bold") }}</strong>{{ $t("title.anonymous.post") }}<br />{{ $t("title.honest.pre") -->
          <!--   }}<strong>{{ -->
          <!--   $t("title.honest.bold") }}</strong>{{ $t("title.honest.post") }}<br />{{ $t("title.verified.pre") -->
          <!--   }}<strong>{{ -->
          <!--   $t("title.verified.bold") }}</strong>{{ $t("title.verified.post") }}</h1> -->
        </div>
        <div class="self-center q-my-lg col-auto min-width-33">
          <q-btn class="full-width" rounded no-caps no-wrap unelevated icon-right="trending_flat" color="brand-teal"
            :size="buttonSize" text-color="brand-dark" :label="$t('getInTouch')" :href="discordUrl" target="_blank" />
        </div>
      </div>
      <q-separator class="width-100 bg-brand" />
      <div class="column flex-center q-pa-md">
        <div class=" width-title">
          <div class="row flex-center" style="gap: 25px;">
            <div>
              <a href="https://www.eu-startups.com/2024/07/these-are-the-15-startups-combating-online-misinformation-that-have-been-granted-e1-8-million-by-the-ec/"
                target="_blank">
                <q-img src="funded_by_eu.png" style="min-width: 280px" />
              </a>
            </div>
            <div>
              <a href="https://ngi.eu/" target="_blank">
                <q-img src="ngi.png" style="min-width: 280px" />
              </a>
            </div>
          </div>
          <h5>
            <div v-html="$t('buildingAgora')" />
          </h5>
          <h5>{{ $t('whatIsCompPropaganda') }}</h5>
          <h4>{{ $t('coreInnovationTitle') }}</h4>
          <h5>
            <div v-html="$t('coreInnovationPart1')" />
          </h5>
          <h5>{{ $t('coreInnovationPart2') }}</h5>
          <h4>{{ $t('otherBuildingBlocksTitle') }}</h4>
          <h5>
            <ul>
              <li>
                {{ $t('otherBuildingBlocksPart1') }}
              </li>
              <li>
                {{ $t('otherBuildingBlocksPart2') }}
              </li>
            </ul>
          </h5>
          <h4>{{ $t('teamTitle') }}</h4>
          <h5><strong><a href="https://www.linkedin.com/in/yuting-jiang-zkorum/" target="_blank">Yuting Jiang -
                CEO</a></strong></h5>
          <q-img src="yuting.jpg" style="max-width: 280px" />
          <h5>
            <div v-html="$t('yutingDescription')" />
          </h5>
          <h5><strong><a href="https://www.linkedin.com/in/nicolas-gimenez-5155aba1/" target="_blank">Nicolas Gimenez -
                CTO</a></strong></h5>
          <q-img src="nicolas.jpg" style="max-width: 280px" />
          <h5>
            <div v-html="$t('nicolasDescription')" />
          </h5>
          <h4>{{ $t('featuredIn') }}</h4>
          <h5>
            <ul>
              <li>
                <a href="https://ssimeetup.org/zkorum-building-next-generation-eagora-powered-ssi-webinar-70-nicolas-gimenez/"
                  target="_blank">SSI Meetup</a>
              </li>
              <li>
                <a href="https://www.eu-startups.com/2024/07/these-are-the-15-startups-combating-online-misinformation-that-have-been-granted-e1-8-million-by-the-ec/"
                  target="_blank">EU-Startups</a>
              </li>
              <li>
                <a href="https://fission.codes/blog/projects-we-love-zkorum/" target="_blank">Fission - Projects We Love
                </a>
              </li>
            </ul>
          </h5>
        </div>
      </div>
    </div>
    <div class="column flex-center bg-brand-teal width-100">
      <div class="q-mt-lg q-mb-sm width-between">
        <q-btn class="full-width" rounded no-caps no-wrap unelevated icon-right="trending_flat" color="brand"
          :size="buttonSize" text-color="white" :label="$t('getInTouch')" :href="discordUrl" />
      </div>
      <div class="row items-center justify-around q-my-sm">
        <!-- NOTE: `style="width: fit-content;"` serves to make the button size fits the text size, however it renders the "col" directives useless :/ -->
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
        <q-btn text-color="brand-dark" unelevated flat rounded outline no-caps type="a" :href="discordUrl"
          target="_blank" icon="bi-discord" />
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
import { computed, onMounted, ref, watch } from 'vue';
import LanguageSwitcher from 'components/LanguageSwitcher.vue';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();


const $q = useQuasar();
const buttonSize = computed(() => {
  return $q.screen.lt.md ? 'lg' : 'xl';
});

const imagesEn: Array<string> & { length: 4 } = ['1.png', '2.png', '3.png', '4.png'];
const imagesFr: Array<string> & { length: 4 } = ['5.png', '6.png', '7.png', '8.png'];
let chosenImages: Array<string> & { length: 4 } = imagesEn;
if (locale.value.includes('fr')) {
  chosenImages = imagesFr;
} else {
  chosenImages = imagesEn;
}
const images = ref(chosenImages)

const indexShownImage = ref(0);

const discordUrl = 'https://discord.gg/cAkAJQSTEU';

onMounted(() => {
  setInterval(function () {
    if (indexShownImage.value < 3) {
      const newIndex = indexShownImage.value + 1;
      indexShownImage.value = newIndex;
    } else {
      const newIndex = 0;
      indexShownImage.value = newIndex;
    }
  }, 5000);
});
watch(locale, () => {
  if (locale.value.includes('fr')) {
    images.value = imagesFr
  } else {
    images.value = imagesEn
  }
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
    @extend .text-h4;
  }

  body.screen--lg & {
    @extend .text-h4;
  }

  body.screen--xl & {
    @extend .text-h3;
  }
}

.width-max {
  width: 100vw;
}

.width-100 {
  width: 100%;
}

.width-title {
  body.screen--xs & {
    width: 100%;
  }

  body.screen--sm & {
    width: 100%;
  }

  body.screen--md & {
    width: 50%;
  }

  body.screen--lg & {
    width: 50%;
  }

  body.screen--xl & {
    width: 50%;
  }
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
