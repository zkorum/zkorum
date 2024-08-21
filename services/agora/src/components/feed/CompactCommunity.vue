<template>
  <div>
    <swiper-container slidesPerView="4" pagination="true">
      <swiper-slide v-for="communityItem in communityList" v-bind:key="communityItem.emoji" class="communityItem">
        <div class="flagIcon">
          {{ communityItem.emoji }}
        </div>
        <span class="flagCountryName">
          {{ communityItem.countryName }}
        </span>
      </swiper-slide>
    </swiper-container>
  </div>


</template>

<script setup lang="ts">

interface FlagItem {
  emoji: string
  countryName: string
}

const communityList: FlagItem[] = [
  {
    "emoji": "🌎",
    "countryName": "World"
  },
  {
    "emoji": "🇫🇷",
    "countryName": "France"
  },
  {
    "emoji": "🇨🇳",
    "countryName": "China"
  },
  {
    "emoji": "🇺🇸",
    "countryName": "United States"
  },
  {
    "emoji": "🇷🇺",
    "countryName": "Russia"
  },
  {
    "emoji": "🇯🇵",
    "countryName": "Japan"
  }
];

</script>

<style scoped>
.container {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 2rem;
}

.communityItem {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 10rem;
  height: 9rem;
}

.flagIcon {
  font-size: 3rem;
}

.flagCountryName {
  font-size: 1.1rem;
  text-align: center;
}
</style>