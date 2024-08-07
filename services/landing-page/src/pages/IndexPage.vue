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
                <q-img :src="fundedByEu" style="min-width: 280px" />
              </a>
            </div>
            <div>
              <a href="https://ngi.eu/" target="_blank">
                <q-img src="ngi.png" style="min-width: 280px" />
              </a>
            </div>
          </div>
          <div class="q-mt-lg">
            <p v-html="$t('buildingAgora')" />
          </div>
          <p>{{ $t('whatIsCompPropaganda') }}</p>
          <h4>{{ $t('coreInnovationTitle') }}</h4>
          <div>
            <p v-html="$t('coreInnovationPart1')" />
          </div>
          <p>{{ $t('coreInnovationPart2') }}</p>
          <h4>{{ $t('otherBuildingBlocksTitle') }}</h4>
          <div>
            <ul>
              <li>
                <p>{{ $t('otherBuildingBlocksPart1') }}</p>
              </li>
              <li>
                <p>{{ $t('otherBuildingBlocksPart2') }}</p>
              </li>
            </ul>
          </div>
          <h4>{{ $t('teamTitle') }}</h4>
          <h5><strong><a href="https://www.linkedin.com/in/yuting-jiang-zkorum/" target="_blank">Yuting Jiang -
                CEO</a></strong></h5>
          <q-img src="yuting.jpg" style="max-width: 280px" />
          <div class="q-mt-lg">
            <p v-html="$t('yutingDescription')" />
          </div>
          <h5><strong><a href="https://www.linkedin.com/in/nicolas-gimenez-5155aba1/" target="_blank">Nicolas Gimenez -
                CTO</a></strong></h5>
          <q-img src="nicolas.jpg" style="max-width: 280px" />
          <div class="q-mt-lg">
            <p v-html="$t('nicolasDescription')" />
          </div>
          <h4>{{ $t('featuredIn') }}</h4>
          <div>
            <ul>
              <li>
                <a href="https://www.eu-startups.com/2024/07/these-are-the-15-startups-combating-online-misinformation-that-have-been-granted-e1-8-million-by-the-ec/"
                  target="_blank">
                  <p>EU-Startups</p>
                </a>
              </li>
              <li>
                <a href="https://ssimeetup.org/zkorum-building-next-generation-eagora-powered-ssi-webinar-70-nicolas-gimenez/"
                  target="_blank">
                  <p>SSI Meetup</p>
                </a>
              </li>
              <li>
                <a href="https://fission.codes/blog/projects-we-love-zkorum/" target="_blank">
                  <p>Fission - Projects We Love</p>
                </a>
              </li>
            </ul>
          </div>
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
import { computed, ref, watch } from 'vue';
import LanguageSwitcher from 'components/LanguageSwitcher.vue';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();


const $q = useQuasar();
const buttonSize = computed(() => {
  return $q.screen.lt.md ? 'lg' : 'xl';
});

const discordUrl = 'https://discord.gg/cAkAJQSTEU';

const fundedByEuEn = 'funded_by_eu.png'
const fundedByEuFr = 'funded_by_eu_fr.png'

let fundedByEuStart: string;
if (locale.value.includes('fr')) {
  fundedByEuStart = fundedByEuFr;
} else {
  fundedByEuStart = fundedByEuEn;
}
const fundedByEu = ref(fundedByEuStart)

watch(locale, () => {
  if (locale.value.includes('fr')) {
    fundedByEu.value = fundedByEuFr
  } else {
    fundedByEu.value = fundedByEuEn
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
