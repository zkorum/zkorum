<template>
  <div>
    <ZKCard padding="2rem">
      <form class="container" @submit.prevent="submitClicked()">
        <div class="title">Contact Us</div>

        <div>
          Please reach out if you would like to join us at developing the next
          generation algorithm!
        </div>

        <div>
          <FloatLabel>
            <InputText id="name" v-model="name" required :style="{ width: '100%' }" />
            <label for="name">Name</label>
          </FloatLabel>
        </div>

        <div>
          <FloatLabel>
            <InputText id="email" v-model="email" type="email" required :style="{ width: '100%' }" />
            <label for="email">Email</label>
          </FloatLabel>
        </div>

        <div>
          <Textarea v-model="message" placeholder="Message" :style="{ width: '100%' }" required />
        </div>

        <ZKButton color="primary" label="Submit" type="submit" />
      </form>
    </ZKCard>
  </div>
</template>

<script setup lang="ts">
import ZKButton from "src/components/ui-library/ZKButton.vue";
import ZKCard from "src/components/ui-library/ZKCard.vue";
import { useDialog } from "src/utils/ui/dialog";
import { ref } from "vue";
import Textarea from "primevue/textarea";
import FloatLabel from "primevue/floatlabel";
import InputText from "primevue/inputtext";

const name = ref("");
const email = ref("");
const message = ref("");

const dialog = useDialog();

function submitClicked() {
  dialog.showContactUsSuccessfulDialog();

  clearForm();
}

function clearForm() {
  name.value = "";
  email.value = "";
  message.value = "";
}
</script>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.title {
  font-size: 1.6rem;
}
</style>
