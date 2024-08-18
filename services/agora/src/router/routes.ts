import { RouteRecordRaw } from "vue-router";
import OnboardingLayout from "layouts/OnboardingLayout.vue";
import { OnboardingLayoutProps } from "@/utils/model/props";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        path: "",
        component: () => import("pages/index.vue"),
        name: "default-home-feed"
      },
    ],

  },
  {
    path: "/welcome",
    component: () => import("@/pages/onboarding/index.vue"),
    name: "welcome"
  },
  {
    path: "/onboarding",
    children: [
      {
        path: "login",
        component: OnboardingLayout,
        props: { hasGoBackButton: true, hasHelpButton: true } as OnboardingLayoutProps,
        children: [
          {
            path: "",
            component: () => import("@/pages/onboarding/login/index.vue"),
            name: "login"
          }
        ]
      },
      {
        path: "passphrase",
        component: OnboardingLayout,
        props: { hasGoBackButton: true, hasHelpButton: true } as OnboardingLayoutProps,
        children: [
          {
            path: ":emailAddressEncoded",
            component: () => import("@/pages/onboarding/passphrase/index.vue"),
            name: "passphrase"
          }
        ]
      },

    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    redirect: "/",
  },

];

export default routes;
