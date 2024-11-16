<template>
  <div>
    <Avatar variant="beam" :name="userName" :colors="boringAvatarColors" class="avatarIcon" />
  </div>
</template>

<script setup lang="ts">
import Avatar from "vue-boring-avatars";

defineProps<{
  userName: string
}>();

const boringAvatarColors = ["#0a0310", "#49007e", "#ff005b", "#ff7d10", "#ffb238"];


</script>
