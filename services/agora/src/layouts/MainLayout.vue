<template>
  <q-layout view="hHh lpR fFf">
    <q-header :reveal="false" bordered class="bg-white" height-hint="98">
      <q-toolbar class="content-between" style="width: 100%">
        <div style="width: 100%">
          <ZKButton icon="menu" text-color-flex="black" flat />
        </div>
        <div class="menuButtons">
          <ZKButton icon="search" text-color-flex="black" flat />
          <ZKButton icon="person" text-color-flex="black" flat />
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container class="container">
      <router-view />
    </q-page-container>

    <q-footer bordered class="bg-white">
      <q-tabs no-caps align="center" outside-arrows mobile-arrows active-color="brand" class="text-black">
        <q-route-tab :to="{ name: 'default-home-feed' }" :icon="currentRoute === '/' ? 'home' : 'o_home'" />
        <q-route-tab :to="{ name: 'communities' }" :icon="currentRoute === '/communities' ? 'group' : 'o_group'
          " />
        <q-route-tab :to="{ name: 'notifications' }" :icon="currentRoute === '/notifications'
          ? 'notifications'
          : 'o_notifications'
          " />
        <q-route-tab :to="{ name: 'settings' }" :icon="currentRoute === '/settings' ? 'settings' : 'o_settings'
          " />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<!-- <template> -->
<!--   <q-layout view="lHh Lpr lFf"> -->
<!--     <q-header elevated> -->
<!--       <q-toolbar> -->
<!--         <q-btn -->
<!--           flat -->
<!--           dense -->
<!--           round -->
<!--           icon="menu" -->
<!--           aria-label="Menu" -->
<!--           @click="toggleLeftDrawer" -->
<!--         /> -->
<!---->
<!--         <q-toolbar-title> -->
<!--           Quasar App -->
<!--         </q-toolbar-title> -->
<!---->
<!--         <div>Quasar v{{ $q.version }}</div> -->
<!--       </q-toolbar> -->
<!--     </q-header> -->
<!---->
<!--     <q-drawer -->
<!--       v-model="leftDrawerOpen" -->
<!--       show-if-above -->
<!--       bordered -->
<!--     > -->
<!--       <q-list> -->
<!--         <q-item-label -->
<!--           header -->
<!--         > -->
<!--           Essential Links -->
<!--         </q-item-label> -->
<!---->
<!--         <EssentialLink -->
<!--           v-for="link in linksList" -->
<!--           :key="link.title" -->
<!--           v-bind="link" -->
<!--         /> -->
<!--       </q-list> -->
<!--     </q-drawer> -->
<!---->
<!--     <q-page-container> -->
<!--       <router-view /> -->
<!--     </q-page-container> -->
<!--   </q-layout> -->
<!-- </template> -->
<!---->
<script setup lang="ts">
// import { ref } from 'vue';
import ZKButton from "@/components/ui-library/ZKButton.vue";
import { useRoute } from "vue-router";
// import EssentialLink, { EssentialLinkProps } from 'components/EssentialLink.vue';
//
// defineOptions({
//   name: 'MainLayout'
// });
//
// const linksList: EssentialLinkProps[] = [
//   {
//     title: 'Docs',
//     caption: 'quasar.dev',
//     icon: 'school',
//     link: 'https://quasar.dev'
//   },
//   {
//     title: 'Github',
//     caption: 'github.com/quasarframework',
//     icon: 'code',
//     link: 'https://github.com/quasarframework'
//   },
//   {
//     title: 'Discord Chat Channel',
//     caption: 'chat.quasar.dev',
//     icon: 'chat',
//     link: 'https://chat.quasar.dev'
//   },
//   {
//     title: 'Forum',
//     caption: 'forum.quasar.dev',
//     icon: 'record_voice_over',
//     link: 'https://forum.quasar.dev'
//   },
//   {
//     title: 'Twitter',
//     caption: '@quasarframework',
//     icon: 'rss_feed',
//     link: 'https://twitter.quasar.dev'
//   },
//   {
//     title: 'Facebook',
//     caption: '@QuasarFramework',
//     icon: 'public',
//     link: 'https://facebook.quasar.dev'
//   },
//   {
//     title: 'Quasar Awesome',
//     caption: 'Community Quasar projects',
//     icon: 'favorite',
//     link: 'https://awesome.quasar.dev'
//   }
// ];
//
// const leftDrawerOpen = ref(false);
//
// function toggleLeftDrawer () {
//   leftDrawerOpen.value = !leftDrawerOpen.value;
// }

const route = useRoute();
const currentRoute = route.path;
</script>

<style scoped>
.menuButtons {
  display: flex;
  gap: 0.5rem;
}

.container {
  max-width: min(50rem, 100%);
  margin: auto;
  padding: 1rem;
}
</style>