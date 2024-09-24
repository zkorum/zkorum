<template>
  <div>
    <div class="container">

      <div class="title">
        <slot name="title"></slot>
      </div>

      <slot name="body"></slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-top: 3rem;
  padding-left: 1rem;
  padding-right: 1rem;
  padding-bottom: 1rem;
}

.title {
  font-size: 1.7rem;
  font-weight: bold;
  padding-bottom: 1rem;
}

</style>
