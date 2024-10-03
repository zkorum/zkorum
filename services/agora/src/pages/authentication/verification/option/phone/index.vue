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

          <Select v-model="selectedCountryCode"
            :virtual-scroller-options="{ lazy: true, itemSize: 40, numToleratedItems: 10 }" :options="countries"
            option-label="name" placeholder="Country Code">
            <template #value="slotProps">
              <div v-if="slotProps.value.code != ''" class="flex items-center">
                <img :alt="slotProps.value.label" :src="'/images/communities/flags/' + slotProps.value.country + '.svg'"
                  class="flagImg" />
                <div>+ {{ slotProps.value.code }}</div>
              </div>
              <span v-else>
                {{ slotProps.placeholder }}
              </span>
            </template>
            <template #option="slotProps">
              <div class="test">
                <img :src="'/images/communities/flags/' + slotProps.option.country + '.svg'" class="flagImg"
                  loading="lazy" />
                <div>{{ slotProps.option.name }}</div>
              </div>
            </template>
          </Select>

          <InputText v-model="inputNumber" placeholder="Phone number" />

          <ZKButton label="Next" color="primary" text-color="white" :disabled="selectedCountryCode.code.length == 0 || inputNumber.length == 0"
            @click="validateNumber()" />

        </div>

      </template>
    </AuthContentWrapper>
  </div>
</template>

<script setup lang="ts">
import AuthContentWrapper from "src/components/authentication/AuthContentWrapper.vue";
import InputText from "primevue/inputtext";
import { ref } from "vue";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import { parsePhoneNumber, getCountries, getCountryCallingCode } from "libphonenumber-js";
import { useDialog } from "src/utils/ui/dialog";
import Select from "primevue/select";

const dialog = useDialog();

const inputNumber = ref("");

const selectedCountryCode = ref<SelectItem>({name: "", country: "", code: ""});
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

.test {
  display:flex;
  gap: 0rem;
}

</style>
