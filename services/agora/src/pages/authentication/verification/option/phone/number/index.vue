<template>
  <div>
    <AuthContentWrapper>
      <template #title> Phone Verification </template>
      <template #body>
        <form @submit.prevent="validateNumber()">
          <div class="container">
            <div>A one-time password will be sent to your phone number.</div>

            <Select v-model="selectedCountryCode"
              filter
              :virtual-scroller-options="{
                lazy: true,
                itemSize: 40,
                numToleratedItems: 10,
              }"
              :options="countries"
              option-label="name"
              placeholder="Country Code"
            >
              <template #value="slotProps">
                <div v-if="slotProps.value.code != ''"
                  class="flex items-center"
                >
                  <img :alt="slotProps.value.label"
                    :src="
                      '/images/communities/flags/' +
                      slotProps.value.country +
                      '.svg'
                    "
                    class="flagImg"
                  />
                  <div>+ {{ slotProps.value.code }}</div>
                </div>
                <span v-else>
                  {{ slotProps.placeholder }}
                </span>
              </template>
              <template #option="slotProps">
                <div class="innerOption">
                  <img :src="
                      '/images/communities/flags/' +
                      slotProps.option.country +
                      '.svg'
                    "
                    class="flagImg"
                    loading="lazy"
                  />
                  <div>{{ slotProps.option.name }}</div>
                </div>
              </template>
            </Select>

            <InputText v-model="inputNumber"
              type="tel"
              placeholder="Phone number"
              required
            />

            <ZKButton label="Next"
              color="primary"
              text-color="white"
              :disabled="
                selectedCountryCode.code.length == 0 || inputNumber.length == 0
              "
              type="submit"
            />
          </div>
        </form>
      </template>
    </AuthContentWrapper>
  </div>
</template>

<script setup lang="ts">
import AuthContentWrapper from "src/components/authentication/AuthContentWrapper.vue";
import InputText from "primevue/inputtext";
import { ref } from "vue";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import {
  parsePhoneNumber,
  getCountries,
  getCountryCallingCode,
  CountryCode,
} from "libphonenumber-js";
import { useDialog } from "src/utils/ui/dialog";
import Select from "primevue/select";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { phoneVerificationStore } from "src/stores/verification/phone";

const dialog = useDialog();

const inputNumber = ref("");

const router = useRouter();

const selectedCountryCode = ref<SelectItem>({
  name: "",
  country: "",
  code: "",
});
interface SelectItem {
  name: string;
  country: string;
  code: string;
}
const countries = ref<SelectItem[]>([]);

const { verificationNumber } = storeToRefs(phoneVerificationStore());

const countryList = getCountries();
for (let i = 0; i < countryList.length; i++) {
  const code = countryList[i];
  const countryItem: SelectItem = {
    name: code + " +" + getCountryCallingCode(code),
    country: code,
    code: getCountryCallingCode(code),
  };
  countries.value.push(countryItem);
}

function isOfTypeCountryCode(countryCode: string): countryCode is CountryCode {
  return [
    "AC",
    "AD",
    "AE",
    "AF",
    "AG",
    "AI",
    "AL",
    "AM",
    "AO",
    "AR",
    "AS",
    "AT",
    "AU",
    "AW",
    "AX",
    "AZ",
    "BA",
    "BB",
    "BD",
    "BE",
    "BF",
    "BG",
    "BH",
    "BI",
    "BJ",
    "BL",
    "BM",
    "BN",
    "BO",
    "BQ",
    "BR",
    "BS",
    "BT",
    "BW",
    "BY",
    "BZ",
    "CA",
    "CC",
    "CD",
    "CF",
    "CG",
    "CH",
    "CI",
    "CK",
    "CL",
    "CM",
    "CN",
    "CO",
    "CR",
    "CU",
    "CV",
    "CW",
    "CX",
    "CY",
    "CZ",
    "DE",
    "DJ",
    "DK",
    "DM",
    "DO",
    "DZ",
    "EC",
    "EE",
    "EG",
    "EH",
    "ER",
    "ES",
    "ET",
    "FI",
    "FJ",
    "FK",
    "FM",
    "FO",
    "FR",
    "GA",
    "GB",
    "GD",
    "GE",
    "GF",
    "GG",
    "GH",
    "GI",
    "GL",
    "GM",
    "GN",
    "GP",
    "GQ",
    "GR",
    "GT",
    "GU",
    "GW",
    "GY",
    "HK",
    "HN",
    "HR",
    "HT",
    "HU",
    "ID",
    "IE",
    "IL",
    "IM",
    "IN",
    "IO",
    "IQ",
    "IR",
    "IS",
    "IT",
    "JE",
    "JM",
    "JO",
    "JP",
    "KE",
    "KG",
    "KH",
    "KI",
    "KM",
    "KN",
    "KP",
    "KR",
    "KW",
    "KY",
    "KZ",
    "LA",
    "LB",
    "LC",
    "LI",
    "LK",
    "LR",
    "LS",
    "LT",
    "LU",
    "LV",
    "LY",
    "MA",
    "MC",
    "MD",
    "ME",
    "MF",
    "MG",
    "MH",
    "MK",
    "ML",
    "MM",
    "MN",
    "MO",
    "MP",
    "MQ",
    "MR",
    "MS",
    "MT",
    "MU",
    "MV",
    "MW",
    "MX",
    "MY",
    "MZ",
    "NA",
    "NC",
    "NE",
    "NF",
    "NG",
    "NI",
    "NL",
    "NO",
    "NP",
    "NR",
    "NU",
    "NZ",
    "OM",
    "PA",
    "PE",
    "PF",
    "PG",
    "PH",
    "PK",
    "PL",
    "PM",
    "PR",
    "PS",
    "PT",
    "PW",
    "PY",
    "QA",
    "RE",
    "RO",
    "RS",
    "RU",
    "RW",
    "SA",
    "SB",
    "SC",
    "SD",
    "SE",
    "SG",
    "SH",
    "SI",
    "SJ",
    "SK",
    "SL",
    "SM",
    "SN",
    "SO",
    "SR",
    "SS",
    "ST",
    "SV",
    "SX",
    "SY",
    "SZ",
    "TA",
    "TC",
    "TD",
    "TG",
    "TH",
    "TJ",
    "TK",
    "TL",
    "TM",
    "TN",
    "TO",
    "TR",
    "TT",
    "TV",
    "TW",
    "TZ",
    "UA",
    "UG",
    "US",
    "UY",
    "UZ",
    "VA",
    "VC",
    "VE",
    "VG",
    "VI",
    "VN",
    "VU",
    "WF",
    "WS",
    "XK",
    "YE",
    "YT",
    "ZA",
    "ZM",
    "ZW",
  ].includes(countryCode);
}

function validateNumber() {
  try {
    const fullNumber =
      "+1 " + selectedCountryCode.value.code + inputNumber.value;
    const country = selectedCountryCode.value.country;
    const isValid = isOfTypeCountryCode(country);
    if (!isValid) {
      dialog.showMessage("Phone Number", "Unsupported country: " + country);
    } else {
      const countryCode: CountryCode = country;
      const phoneNumber = parsePhoneNumber(fullNumber, {
        defaultCountry: countryCode,
      });
      if (phoneNumber.isValid()) {
        verificationNumber.value = fullNumber;
        router.push({ name: "verification-option-phone-code" });
      } else {
        dialog.showMessage(
          "Phone Number",
          "The input phone number is invalid."
        );
      }
    }
  } catch (e) {
    console.log(e);
    dialog.showMessage(
      "Phone Number",
      "Failed to parse the input phone number."
    );
  }
}
</script>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.selectElement {
  width: 4rem;
}

.flagImg {
  width: 3rem;
  padding-right: 1rem;
}

.innerOption {
  display: flex;
  gap: 0rem;
}
</style>
