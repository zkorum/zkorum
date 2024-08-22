<template>
  <div>
    <div class="container">
      <swiper-container slidesPerView="4.5">
        <swiper-slide v-for="communityItem in communityList" v-bind:key="communityItem.name">
          <RouterLink :to="{ name: 'community-single', params: { countryCode: communityItem.name } }">
            <div class="outerPadding">
              <div class="communityItemStyle">
                <div class="flagStyle">
                  <img class="flagImage" :src="'/images/communities/flags/' + communityItem.code + '.svg'" />
                </div>
                <div class="flagCountryName">
                  {{ communityItem.countryName }}
                </div>
              </div>
            </div>
          </RouterLink>
        </swiper-slide>
      </swiper-container>
    </div>
  </div>
</template>

<script setup lang="ts">

interface FlagItem {
  name: string
  countryName: string
  code: string
}

const communityList: FlagItem[] = [
  {
    "name": "world",
    "countryName": "World",
    "code": "WORLD"
  },
  {
    "name": "france",
    "countryName": "France",
    "code": "FR"
  },
  {
    "name": "china",
    "countryName": "China",
    "code": "CN"
  },
  {
    "name": "united-states",
    "countryName": "United States",
    "code": "US"
  },
  {
    "name": "russia",
    "countryName": "Russia",
    "code": "RU"
  },
  {
    "name": "japan",
    "countryName": "Japan",
    "code": "JP"
  }
];

</script>

<style scoped lang="scss">
a {
  text-decoration: none;
}

.container {
  border-radius: 15px;
}

.communityItemStyle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
}

.communityItemStyle:hover {
  border-radius: 15px;
  background-color: rgb(0 0 0 / 0.08);
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}

.flagImage {
  width: 3rem;
  border-radius: 5px;
  border-style: solid;
  border-width: 1px;
  border-color: #e5e7eb;
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

.outerPadding {
  padding: 0.5rem;
}
</style>