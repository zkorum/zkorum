<template>
  <div>
    <ZKCard padding="2rem">
      <form class="container" @submit.prevent="submitClicked()">

        <div class="title">
          Contact Us
        </div>

        <div>
          Please reach out if you would like to join us at developing the next generation algorithm!
        </div>

        <div>
          <q-input v-model="name" label="Name" type="text" required />
        </div>

        <div>
          <q-input v-model="email" type="email" label="Email Address" required />
        </div>

        <div>
          <q-input v-model="message" label="Message (optional)" type="textarea" />
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
  display:flex;
  flex-direction: column;
  gap: 1rem;
}

.title {
  font-size: 2rem;
}

</style>
