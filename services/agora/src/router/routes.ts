import { RouteRecordRaw } from "vue-router";
import MainLayout from "layouts/MainLayout.vue";
import DefaultMenuBar from "src/components/navigation/DefaultMenuBar.vue";
import { MainLayoutProps, DefaultMenuBarProps } from "src/utils/model/props";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: MainLayout,
    props: {
        addBottomPadding: false, enableHeader: true, enableFooter: true, reducedWidth: false
      } as MainLayoutProps,
    children: [
      {
        path: "/",
        components: {
          default: () => import("pages/index.vue"), topmenubar: DefaultMenuBar
        },
        props: {
          topmenubar: {
            hasBackButton: false, hasSettingsButton: true, hasCloseButton: false, hasLoginButton: true
          } as DefaultMenuBarProps
        },
        name: "default-home-feed"
      },
      {
        path: "/user-profile:userId",
        components: {
          default: () => import("pages/user-profile/index.vue"), topmenubar: DefaultMenuBar
        },
        props: {
          topmenubar: {
            hasBackButton: false, hasSettingsButton: true, hasCloseButton: false, hasLoginButton: true
          } as DefaultMenuBarProps
        },
        name: "user-profile"
      },
      {
        path: "/settings",
        components: {
          default: () => import("pages/settings/index.vue"), topmenubar: DefaultMenuBar
        },
        props: {
          topmenubar: {
            hasBackButton: false, hasSettingsButton: true, hasCloseButton: false, hasLoginButton: true
          } as DefaultMenuBarProps
        },
        name: "settings-page"
      },
      {
        path: "/help",
        components: {
          default: () => import("pages/help/index.vue"), topmenubar: DefaultMenuBar
        },
        props: {
          topmenubar: {
            hasBackButton: false, hasSettingsButton: true, hasCloseButton: false, hasLoginButton: true
          } as DefaultMenuBarProps
        },
        name: "help-page"
      }
    ]
  },
  {
    path: "/post",
    component: MainLayout,
    props: {
      addBottomPadding: false, enableHeader: false, enableFooter: false, reducedWidth: false
    } as MainLayoutProps,
    children: [
      {
        path: "create",
        components: {
          default: () => import("pages/post/create/index.vue"), topmenubar: DefaultMenuBar
        },
        props: {
          topmenubar: {
            hasBackButton: false, hasSettingsButton: false, hasCloseButton: true, hasLoginButton: true
          } as DefaultMenuBarProps
        },
        name: "create-post"
      },
    ]
  },
  {
    path: "/post",
    component: MainLayout,
    props: { addBottomPadding: true, enableHeader: true, enableFooter: false, reducedWidth: false } as MainLayoutProps,
    children: [
      {
        path: ":postSlugId",
        components: {
          default: () => import("pages/post/[postSlugId].vue"), topmenubar: DefaultMenuBar
        },
        props: {
          default: true,
          topmenubar: {
            hasBackButton: false, hasSettingsButton: true, hasCloseButton: true, hasLoginButton: true
          } as DefaultMenuBarProps
        },
        name: "single-post"
      }
    ]
  },
  {
    path: "/onboarding",
    components: {
      default: () => import("pages/onboarding/index.vue")
    },
    name: "welcome"
  },
  {
    path: "/onboarding",
    component: MainLayout,
    props: {
      addBottomPadding: true, enableHeader: true, enableFooter: false, useStylelessFooter: false, reducedWidth: true
    } as MainLayoutProps,
    children: [
      {
        path: "login",
        components: {
          default: () => import("pages/onboarding/login/index.vue"), topmenubar: DefaultMenuBar
        },
        props: {
          topmenubar: {
            hasBackButton: true, hasSettingsButton: true, hasCloseButton: false, hasLoginButton: false
          } as DefaultMenuBarProps
        },
        name: "login"
      },
      {
        path: "passphrase/:emailAddressEncoded",
        components: {
          default: () => import("pages/onboarding/passphrase/index.vue"), topmenubar: DefaultMenuBar
        },
        props: {
          topmenubar: {
            hasBackButton: true, hasSettingsButton: true, hasCloseButton: false, hasLoginButton: false
          } as DefaultMenuBarProps
        },
        name: "passphrase"
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
