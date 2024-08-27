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
      "id": "india",
      "countryName": "India",
      "code": "IN"
    },
    {
      "id": "slovakia",
      "countryName": "Slovakia",
      "code": "SK"
    },
    {
      "id": "venezuela",
      "countryName": "Venezuela",
      "code": "VE"
    },
  ];

  return { communityList }

});
