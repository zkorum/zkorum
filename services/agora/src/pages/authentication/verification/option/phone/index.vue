<template>
  <div>
    <AuthContentWrapper>
      <template #title>
        Phone Verification
      </template>
      <template #body>

        <div class="container">

          <div>
            A one-time password will be sent to your phone number.
          </div>

          <Select v-model="selectedCountryCode" :options="countries" option-label="name" placeholder="Country Code">
            <template #value="slotProps">
              <div v-if="slotProps.value" class="flex items-center">
                <img :alt="slotProps.value.label"
                  :src="'/images/communities/flags/' + slotProps.value.country + '.svg'" class="flagImg" />
                <div>+ {{ slotProps.value.code }}</div>
              </div>
              <span v-else>
                {{ slotProps.placeholder }}
              </span>
            </template>
            <template #option="slotProps">
              <div class="flex items-center">
                <img :alt="slotProps.option.label"
                  :src="'/images/communities/flags/' + slotProps.option.country + '.svg'" class="flagImg" />
                <div>{{ slotProps.option.name }}</div>
              </div>
            </template>
          </Select>

          <InputText v-model="inputNumber" placeholder="Phone number" />

          <ZKButton label="Next" color="primary" text-color="white" @click="validateNumber()" />

          <SkipForLaterButton @click="skipButton()" />
        </div>

      </template>
    </AuthContentWrapper>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import SkipForLaterButton from "src/components/authentication/SkipForLaterButton.vue";
import AuthContentWrapper from "src/components/authentication/AuthContentWrapper.vue";
import InputText from "primevue/inputtext";
import { ref } from "vue";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import { parsePhoneNumber, getCountries, getCountryCallingCode } from "libphonenumber-js";
import { useDialog } from "src/utils/ui/dialog";
import Select from "primevue/select";

const router = useRouter();
const dialog = useDialog();

const inputNumber = ref("");

const selectedCountryCode = ref();
interface SelectItem {
  name: string;
  country: string;
  code: string
}
const countries = ref<SelectItem[]>([]);

const countryList = getCountries();
for (let i = 0; i < countryList.length; i++) {
  const code = countryList[i];
  const countryItem: SelectItem = {
    name: code + " +" + getCountryCallingCode(code),
    country: code,
    code: getCountryCallingCode(code)
  };
  countries.value.push(countryItem);
}

function validateNumber() {
  try {
    console.log(selectedCountryCode.value);
    const fullNumber = "+1 " + selectedCountryCode.value.code + inputNumber.value;
    console.log(fullNumber);
    const phoneNumber = parsePhoneNumber(fullNumber);
    if (phoneNumber.isValid()) {
      dialog.showMessage("Phone Number", "Correct");
    } else {
      dialog.showMessage("Phone Number", "Incorrect");
    }
  } catch (e) {
    console.log(e);
    dialog.showMessage("Phone Number", "Parsing error");
  }

}

function skipButton() {
  router.push({ name: "default-home-feed" });
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
  width: 2rem;
  padding-right: 1rem;
}

</style>
