<template>
  <div class="container">
    <swiper-container slidesPerView="4" pagination="true">
      <swiper-slide v-for="communityItem in communityList" v-bind:key="communityItem.emoji">
        <RouterLink :to="{ name: 'community-single', params: { countryCode: communityItem.code.toLowerCase() } }">
          <div class="communityItem">
            <div class="flagStyle">
              <span v-if="communityItem.isEmote" class="flagIcon">
                {{ communityItem.emoji }}
              </span>
              <span v-if="!communityItem.isEmote">
                <img class="flagImage" :src="'/public/images/communities/flags/' + communityItem.code + '.svg'" />
              </span>
            </div>
            <span class="flagCountryName">
              {{ communityItem.countryName }}
            </span>
          </div>

        </RouterLink>
      </swiper-slide>
    </swiper-container>
  </div>


</template>

<script setup lang="ts">

interface FlagItem {
  emoji: string
  countryName: string
  isEmote: boolean
  code: string
}

const communityList: FlagItem[] = [
  {
    "emoji": "🌎",
    "countryName": "World",
    "isEmote": true,
    "code": "all"
  },
  {
    "emoji": "🇫🇷",
    "countryName": "France",
    "isEmote": false,
    "code": "FR"
  },
  {
    "emoji": "🇨🇳",
    "countryName": "China",
    "isEmote": false,
    "code": "CN"
  },
  {
    "emoji": "🇺🇸",
    "countryName": "United States",
    "isEmote": false,
    "code": "US"
  },
  {
    "emoji": "🇷🇺",
    "countryName": "Russia",
    "isEmote": false,
    "code": "RU"
  },
  {
    "emoji": "🇯🇵",
    "countryName": "Japan",
    "isEmote": false,
    "code": "JP"
  }
];

</script>

<style scoped>
a {
  text-decoration: none;
}

.container {
  background-color: aliceblue;
  border-radius: 15px;
  margin: 1rem;
}

.communityItem {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 10rem;
  height: 9rem;
}

.flagIcon {
  font-size: 2.5rem;
}

.flagImage {
  width: 3rem;
  border-radius: 5px;
}

.flagCountryName {
  text-align: center;
  color: black;
}

.flagStyle {
  display: flex;
  align-items: center;
  height: 5rem;
}
</style>