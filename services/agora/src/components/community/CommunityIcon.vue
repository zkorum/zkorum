<template>
  <div>
    <div class="communityItemStyle">
      <div class="flagStyle">
        <img class="flagImage" :src="imageLink" />
      </div>
      <div class="flagCountryName" v-if="showCountryName">
        {{ countryName }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

const props = defineProps<{
  communityName: string
  showCountryName: boolean
}>()

const imageLink = ref("");
const countryName = ref("");

onMounted(() => {
  mapCommunityItem(props.communityName);
})

interface CommunityItem {
  name: string
  countryName: string
  code: string
}

const communityList: CommunityItem[] = [
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

function mapCommunityItem(communityName: string) {
  for (let i = 0; i < communityList.length; i++) {
    const communityItem = communityList[i];
    if (communityItem.name == communityName) {
      imageLink.value = "/images/communities/flags/" + communityItem.code + ".svg";
      countryName.value = communityItem.countryName;
      break;
    }
  }
}

props.communityName

</script>

<style scoped>
.communityItemStyle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
}

.flagStyle {
  display: flex;
  align-items: center;
  justify-content: center;
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
</style>