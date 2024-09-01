import { RouteRecordRaw } from "vue-router";
import MainLayout from "layouts/MainLayout.vue";
import { MainLayoutProps } from "@/utils/model/props";

const routes: RouteRecordRaw[] = [
  {
    path: "/post",
    component: MainLayout,
    props: { headerHasGoBackButton: false, headerHasSettingsButton: true, addBottomPadding: false, addOuterPadding: false, enableHeader: false, enableFooter: false, useStylelessFooter: true } as MainLayoutProps,
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
    props: { headerHasGoBackButton: false, headerHasSettingsButton: true, addBottomPadding: false, addOuterPadding: true, enableHeader: true, enableFooter: true, useStylelessFooter: false } as MainLayoutProps,
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
      {
        path: "/community",
        children: [
          {
            path: "explore",
            component: () => import("@/pages/community/explore/index.vue"),
            name: "community-explore",
          }
        ]
      },
      {
        path: "/settings",
        component: () => import("pages/settings/index.vue"),
        name: "settings-page"
      },
      {
        path: "/help",
        component: () => import("pages/help/index.vue"),
        name: "help-page"
      },
      {
        path: "/",
        component: () => import("pages/index.vue"),
        name: "default-home-feed"
      }
    ]
  },
  {
    path: "/",
    component: MainLayout,
    props: { headerHasGoBackButton: true, headerHasSettingsButton: true, addBottomPadding: true, addOuterPadding: true, enableHeader: true, enableFooter: true, useStylelessFooter: false } as MainLayoutProps,
    children: [
      {
        path: "/a",
        children: [
          {
            path: ":communityId",
            component: () => import("@/pages/a/[communityId]/index.vue"),
            name: "community-single",
            children: [
              {
                path: "post",
                children: [
                  {
                    path: ":postSlugId",
                    component: () => import("pages/a/[communityId]/post/[postSlugId].vue"),
                    name: "single-post"
                  }
                ]
              }
            ]
          }
        ]
      }
    ],
  },
  {
    path: "/welcome",
    component: () => import("@/pages/welcome/index.vue"),
    name: "welcome"
  },
  {
    path: "/onboarding",
    component: MainLayout,
    props: { headerHasGoBackButton: true, headerHasSettingsButton: false, addBottomPadding: true, addOuterPadding: true, enableHeader: true, enableFooter: false, useStylelessFooter: false } as MainLayoutProps,
    children: [
      {
        path: "login",
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
