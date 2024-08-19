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
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        path: "/communities",
        component: () => import("@/pages/communities/index.vue"),
        name: "communities"
      },
    ],
  },
  {
    path: "/post",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        path: ":postSlugId",
        component: () => import("@/pages/post/index.vue"),
        name: "single-post"
      }
    ]
  },
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        path: "/notifications",
        component: () => import("@/pages/notifications/index.vue"),
        name: "notifications"
      },
    ],
  },
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        path: "/settings",
        component: () => import("@/pages/settings/index.vue"),
        name: "settings"
      },
    ],
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
