<template>
  <q-dialog v-model="showDialog" position="bottom">
    <ZKBottomDialogContainer>
      <button
        v-if="canPostAsPersonal"
        type="button"
        class="account-option"
        :class="{
          'account-option--selected': isAccountSelected({
            isOrganization: false,
          }),
        }"
        :aria-pressed="!postAs.postAsOrganization"
        @click="setPostAs({ isOrganization: false })"
      >
        <DynamicProfileImage
          :user-identity="profileData.userName"
          :size="32"
          class="account-avatar"
        />
        <span class="account-name">{{ profileData.userName }}</span>
      </button>

      <button
        v-for="organization in availableOrganizations"
        :key="organization.slug"
        type="button"
        class="account-option"
        :class="{
          'account-option--selected': isAccountSelected({
            isOrganization: true,
            organizationSlug: organization.slug,
          }),
        }"
        :aria-pressed="
          isAccountSelected({
            isOrganization: true,
            organizationSlug: organization.slug,
          })
        "
        @click="
          setPostAs({
            isOrganization: true,
            organizationSlug: organization.slug,
          })
        "
      >
        <DynamicProfileImage
          v-if="organization.imageUrl !== undefined"
          :user-identity="organization.name"
          :size="32"
          :organization-image-url="organization.imageUrl"
          class="account-avatar"
        />
        <span class="account-name">{{ organization.name }}</span>
      </button>
    </ZKBottomDialogContainer>
  </q-dialog>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import DynamicProfileImage from "src/components/account/DynamicProfileImage.vue";
import ZKBottomDialogContainer from "src/components/ui-library/ZKBottomDialogContainer.vue";
import type { PostAsSettings } from "src/composables/conversation/draft";
import { useUserStore } from "src/stores/user";
import { computed } from "vue";

interface Props {
  modelValue: boolean;
  allowedPostAs: readonly PostAsSettings[] | undefined;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { profileData } = storeToRefs(useUserStore());

const postAs = defineModel<PostAsSettings>("postAs", { required: true });

const canPostAsPersonal = computed(
  () =>
    props.allowedPostAs === undefined ||
    props.allowedPostAs.some((identity) => !identity.postAsOrganization)
);
const availableOrganizations = computed(() => {
  const identities = props.allowedPostAs;
  if (identities === undefined) return profileData.value.organizationList;
  const slugs = new Set(
    identities
      .filter((identity) => identity.postAsOrganization)
      .map((identity) => identity.organizationName)
  );
  return profileData.value.organizationList.filter((organization) =>
    slugs.has(organization.slug)
  );
});

const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

type AccountSelection =
  | { isOrganization: false }
  | { isOrganization: true; organizationSlug: string };

function setPostAs(selection: AccountSelection): void {
  if (selection.isOrganization) {
    postAs.value = {
      postAsOrganization: true,
      organizationName: selection.organizationSlug,
    };
  } else {
    postAs.value = {
      postAsOrganization: false,
      organizationName: "",
    };
  }
  showDialog.value = false;
}

function isAccountSelected(selection: AccountSelection): boolean {
  if (selection.isOrganization) {
    return (
      postAs.value.postAsOrganization &&
      postAs.value.organizationName === selection.organizationSlug
    );
  }

  return !postAs.value.postAsOrganization;
}
</script>

<style scoped lang="scss">
.account-option {
  width: 100%;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: start;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 12px 16px;
  cursor: pointer;
  min-height: 56px;
  @include hover-effects(
    $hover-background-color,
    $selected-hover-background-color
  );

  &--selected {
    @extend .selected;
  }
}

.account-avatar {
  margin-inline-end: 12px;
  flex-shrink: 0;
}

.account-name {
  font-size: 16px;
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
}
</style>
