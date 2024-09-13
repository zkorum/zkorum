<template>

  <div class="innerStyle">
    <slot />
  </div>

</template>


<style scoped>
.innerStyle {
  width: min(35rem, 100%);
  margin: auto;
}
</style>