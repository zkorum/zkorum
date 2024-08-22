<template>
  <div class="container">
    <swiper-container slidesPerView="3.5">
      <swiper-slide v-for="communityItem in communityList" v-bind:key="communityItem.emoji">
        <RouterLink :to="{ name: 'community-single', params: { countryCode: communityItem.code.toLowerCase() } }">
          <div class="communityItemStyle">
            <div class="flagStyle">
              <img class="flagImage" :src="'/images/communities/flags/' + communityItem.code + '.svg'" />
            </div>
            <div class="flagCountryName">
              {{ communityItem.countryName }}
            </div>
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
  code: string
}

const communityList: FlagItem[] = [
  {
    "emoji": "🌎",
    "countryName": "World",
    "code": "WORLD"
  },
  {
    "emoji": "🇫🇷",
    "countryName": "France",
    "code": "FR"
  },
  {
    "emoji": "🇨🇳",
    "countryName": "China",
    "code": "CN"
  },
  {
    "emoji": "🇺🇸",
    "countryName": "United States",
    "code": "US"
  },
  {
    "emoji": "🇷🇺",
    "countryName": "Russia",
    "code": "RU"
  },
  {
    "emoji": "🇯🇵",
    "countryName": "Japan",
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

.communityItemStyle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
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
  justify-content: center;
}
</style>