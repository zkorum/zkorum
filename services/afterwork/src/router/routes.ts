import { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    meta: { transition: "slide-leave" },
    children: [
      { path: "", component: () => import("pages/IndexPage.vue") },
    ],
  },
  {
    path: "/login",
    component: () => import("components/auth/HankoAuth.vue"),
  },
  {
    path: "/post",
    component: () => import("layouts/PostLayout.vue"),
    meta: { transition: "slide-enter" },
    children: [
      { path: "", component: () => import("components/TestComponent.vue") },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    redirect: "/",
  },
];

export default routes;
