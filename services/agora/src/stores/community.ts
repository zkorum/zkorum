import { defineStore } from "pinia";

export interface CommunityItem {
  id: string
  countryName: string
  code: string
}

export interface CompanyItem {
  label: string
  id: string
  profilePicture: string
}

export const useCommunityStore = defineStore("community", () => {

  const companyList: CompanyItem[] = [
    {
      label: "European Pirate Party",
      id: "pirates",
      profilePicture: "european-pirate-party.png"
    },
    {
      label: "Human Rights Watch",
      id: "hrw",
      profilePicture: "human-rights-watch-logo.png"
    },
    {
      label: "Pew Research Center",
      id: "pew",
      profilePicture: "pew-research-center.png"
    },
    {
      label: "UNESCO",
      id: "unesco",
      profilePicture: "UNESCO_logo.png"
    },
    {
      label: "UnHerd",
      id: "unherd",
      profilePicture: "unherd_limited_logo.jpeg"
    },
  ];

  function getCompanyItemFromId(id: string): CompanyItem {
    for (let i = 0; i < companyList.length; i++) {
      const companyItem = companyList[i];
      if (companyItem.id == id) {
        return companyItem;
      }
    }

    return {
      label: "",
      id: "",
      profilePicture: ""
    }
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

  return { communityList, companyList, getCompanyItemFromId }

});
