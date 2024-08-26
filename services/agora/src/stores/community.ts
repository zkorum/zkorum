import { defineStore } from "pinia";

export const useCommunityStore = defineStore("community", () => {

  interface CommunityItem {
    id: string
    countryName: string
    code: string
  }

  const communityList: CommunityItem[] = [
    {
      "id": "world",
      "countryName": "World",
      "code": "WORLD"
    },
    {
      "id": "france",
      "countryName": "France",
      "code": "FR"
    },
    {
      "id": "china",
      "countryName": "China",
      "code": "CN"
    },
    {
      "id": "united-states",
      "countryName": "United States",
      "code": "US"
    },
    {
      "id": "russia",
      "countryName": "Russia",
      "code": "RU"
    },
    {
      "id": "japan",
      "countryName": "Japan",
      "code": "JP"
    }
  ];

  return { communityList }

});
