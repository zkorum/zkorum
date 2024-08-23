<template>
  <div>
    <h3>Create Post</h3>

    <q-form @submit="onSubmit" @reset="onReset">
      <ZKCard>
        <div class="formStyle">
          <div class="formElement">
            <div class="header">
              Community <q-select no-error-icon v-model="communityName" :options="communityOptions" />
            </div>
          </div>

          <div class="formElement">
            <div class="header">
              Title *
            </div>
            <q-input filled no-error-icon type="text" v-model="postTitle" lazy-rules
              :rules="[val => val && val.length > 0 || 'This field is required']" />
          </div>

          <div class="formElement">
            <div class="header">
              Body
            </div>
            <q-input filled no-error-icon type="textarea" v-model="postBody" lazy-rules />
          </div>

          <!--<q-toggle v-model="accept" label="I accept the license and terms" />-->

          <div>
            <ZKButton label="Submit" type="submit" />
            <ZKButton label="Reset" type="reset" color-flex="primary" class="q-ml-sm" />
          </div>

        </div>

      </ZKCard>

    </q-form>

  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import ZKButton from "@/components/ui-library/ZKButton.vue";
import ZKCard from "@/components/ui-library/ZKCard.vue";

const route = useRoute();
const router = useRouter();

console.log(route.params.communityName);

const postTitle = ref("");
const postBody = ref("");

const communityList = ["France", "World"];
const communityName = ref("World");
const communityOptions = ref(communityList);

function onSubmit() {
  router.push({ name: "single-post", params: { postSlugId: "asdf" } })
}

function onReset() {
  postTitle.value = "";
  postBody.value = "";
  communityName.value = communityList[0];
}

</script>

<style scoped lang="scss">
.header {
  font-size: 1.2rem;
}

.formStyle {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1rem;
}
</style>