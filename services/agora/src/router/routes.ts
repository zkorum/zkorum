import { RouteRecordRaw } from "vue-router";
import MainLayout from "layouts/MainLayout.vue";
import { MainLayoutProps } from "@/utils/model/props";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: MainLayout,
    props: { headerHasGoBackButton: false, headerHasSettingsButton: true, addBottomPadding: false, enableHeader: true, useStylelessFooter: false } as MainLayoutProps,
    children: [
      {
        path: "",
        component: () => import("pages/index.vue"),
        name: "default-home-feed"
      },
    ],
  },
  {
    path: "/community",
    component: MainLayout,
    props: { headerHasGoBackButton: false, headerHasSettingsButton: true, addBottomPadding: false, enableHeader: true, useStylelessFooter: false } as MainLayoutProps,
    children: [
      {
        path: "explore",
        component: () => import("@/pages/community/explore/index.vue"),
        name: "community-explore",
      },
      {
        path: ":communityId",
        component: () => import("@/pages/community/[communityId].vue"),
        name: "community-single"
      }
    ]
  },
  {
    path: "/post",
    component: MainLayout,
    props: { headerHasGoBackButton: true, headerHasSettingsButton: true, addBottomPadding: true, enableHeader: true, useStylelessFooter: false } as MainLayoutProps,
    children: [
      {
        path: ":postSlugId",
        component: () => import("@/pages/post/index.vue"),
        name: "single-post"
      }
    ]
  },
  {
    path: "/post",
    component: MainLayout,
    props: { headerHasGoBackButton: false, headerHasSettingsButton: true, addBottomPadding: true, enableHeader: false, useStylelessFooter: true } as MainLayoutProps,
    children: [
      {
        path: "create/:communityId?",
        component: () => import("@/pages/post/create/index.vue"),
        name: "create-post"
      }
    ]
  },
  {
    path: "/",
    component: MainLayout,
    props: { headerHasGoBackButton: false, headerHasSettingsButton: true, addBottomPadding: false, enableHeader: true, useStylelessFooter: false } as MainLayoutProps,
    children: [
      {
        path: "/notifications",
        component: () => import("@/pages/notifications/index.vue"),
        name: "notifications"
      },
      {
        path: "/user-profile",
        children: [
          {
            path: ":userId",
            component: () => import("@/pages/user-profile/index.vue"),
            name: "user-profile"
          }
        ]
      },
    ],
  },
  {
    path: "/welcome",
    component: () => import("@/pages/welcome/index.vue"),
    name: "welcome"
  },
  {
    path: "/onboarding",
    children: [
      {
        path: "login",
        component: MainLayout,
        props: { headerHasGoBackButton: true, headerHasSettingsButton: false, addBottomPadding: true, enableHeader: true, useStylelessFooter: false } as MainLayoutProps,
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
        component: MainLayout,
        props: { headerHasGoBackButton: true, headerHasSettingsButton: false, addBottomPadding: true, enableHeader: true, useStylelessFooter: false } as MainLayoutProps,
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
