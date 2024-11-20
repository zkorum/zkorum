<template>
  <div>
    <AuthContentWrapper>
      <template #title> Phone Verification </template>
      <template #body>
        <form @submit.prevent="validateNumber()">
          <div class="container">
            <div>A one-time password will be sent to your phone number.</div>

            <Select
              v-model="selectedCountryCode"
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
                <div
                  v-if="slotProps.value.code != ''"
                  class="flex items-center"
                >
                  <img
                    :alt="slotProps.value.label"
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
                  <img
                    :src="
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

            <InputText
              v-model="inputNumber"
              type="tel"
              placeholder="Phone number"
              required
            />

            <ZKButton
              label="Next"
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

const { verificationPhoneNumber: verificationNumber } = storeToRefs(
  phoneVerificationStore()
);

const countryList = getCountries();
for (let i = 0; i < countryList.length; i++) {
  const country = countryList[i];
  const countryItem: SelectItem = {
    name: country + " +" + getCountryCallingCode(country),
    country: country,
    code: getCountryCallingCode(country),
  };
  countries.value.push(countryItem);
} // TODO: some phone numbers may not be associated with any country: https://gitlab.com/catamphetamine/libphonenumber-js/-/tree/master?ref_type=heads#non-geographic - probably add those manually in the future

function validateNumber() {
  try {
    const phoneNumber = parsePhoneNumber(inputNumber.value, {
      defaultCallingCode: selectedCountryCode.value.code,
    });
    if (phoneNumber.isValid()) {
      verificationNumber.value = phoneNumber.number;
      // TODO: use phoneNumber and defaultCallingCode to send the OTP on click and add both to the store in case the user wants to resend in next page
      router.push({ name: "verification-option-phone-code" });
    } else {
      dialog.showMessage("Phone Number", "The input phone number is invalid.");
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
