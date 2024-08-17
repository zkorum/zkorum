import { RouteRecordRaw } from "vue-router";
import OnboardingLayout from "layouts/OnboardingLayout.vue";
import { OnboardingLayoutProps } from "@/utils/model/props";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", name: "home-screen", component: () => import("pages/index.vue") },
    ]
  },
  {
    path: "/welcome",
    component: () => import("@/pages/welcome/index.vue"),
    name: "welcome"
  },
  {
    path: "/onboarding/login",
    component: OnboardingLayout,
    props: { hasGoBackButton: true, hasHelpButton: true } as OnboardingLayoutProps,
    children: [
      { path: "", component: () => import("@/pages/onboarding/login/index.vue") },
    ],
  },
  {
    path: "/onboarding/:flowId/verify",
    component: () => import("@/pages/onboarding/verification/index.vue"),
  },
  {
    path: "/onboarding/passphrase",
    component: () => import("@/pages/onboarding/passphrase/index.vue"),
  },
  {
    path: "/onboarding/rules",
    component: () => import("@/pages/onboarding/promise-rules/index.vue"),
  },
  /*
  {
    path: "/post",
    component: () => import("layouts/PostLayout.vue"),
    meta: { transition: "slide-enter" },
    children: [
      { path: "", component: () => import("components/TestComponent.vue") },
    ],
  },
  */

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    redirect: "/",
  },

];

export default routes;
