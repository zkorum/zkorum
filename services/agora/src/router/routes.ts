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
        path: "/user-profile",
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
    path: "/legal",
    component: MainLayout,
    props: {
      addBottomPadding: false, enableHeader: true, enableFooter: false, reducedWidth: false
    } as MainLayoutProps,
    children: [
      {
        path: "privacy",
        components: {
          default: () => import("pages/legal/privacy/index.vue"), topmenubar: DefaultMenuBar
        },
        props: {
          topmenubar: {
            hasBackButton: true, hasSettingsButton: false, hasCloseButton: false, hasLoginButton: false
          } as DefaultMenuBarProps
        },
        name: "privacy"
      },
      {
        path: "terms",
        components: {
          default: () => import("pages/legal/terms/index.vue"), topmenubar: DefaultMenuBar
        },
        props: {
          topmenubar: {
            hasBackButton: true, hasSettingsButton: false, hasCloseButton: false, hasLoginButton: false
          } as DefaultMenuBarProps
        },
        name: "terms"
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
    path: "/authentication",
    components: {
      default: () => import("pages/authentication/index.vue")
    },
    name: "welcome"
  },
  {
    path: "/authentication",
    component: MainLayout,
    props: {
      addBottomPadding: true, enableHeader: true, enableFooter: false, useStylelessFooter: false, reducedWidth: true
    } as MainLayoutProps,
    children: [
      {
        path: "/login/email",
        components: {
          default: () => import("src/pages/authentication/login/email/index.vue"), topmenubar: DefaultMenuBar
        },
        props: {
          topmenubar: {
            hasBackButton: true, hasSettingsButton: true, hasCloseButton: false, hasLoginButton: false
          } as DefaultMenuBarProps
        },
        name: "login-email"
      },
      {
        path: "/login/verify-email",
        components: {
          default: () => import("src/pages/authentication/login/verify/index.vue"), topmenubar: DefaultMenuBar
        },
        props: {
          topmenubar: {
            hasBackButton: true, hasSettingsButton: true, hasCloseButton: false, hasLoginButton: false
          } as DefaultMenuBarProps
        },
        name: "login-verify"
      },
      {
        path: "/verification/instructions",
        components: {
          default: () => import("src/pages/authentication/verification/instructions/index.vue"), topmenubar: DefaultMenuBar
        },
        props: {
          topmenubar: {
            hasBackButton: true, hasSettingsButton: true, hasCloseButton: false, hasLoginButton: false
          } as DefaultMenuBarProps
        },
        name: "verification-instructions"
      },
      {
        path: "/verification/welcome",
        components: {
          default: () => import("src/pages/authentication/verification/welcome/index.vue"), topmenubar: DefaultMenuBar
        },
        props: {
          topmenubar: {
            hasBackButton: true, hasSettingsButton: true, hasCloseButton: false, hasLoginButton: false
          } as DefaultMenuBarProps
        },
        name: "verification-welcome"
      },
      {
        path: "/verification/successful",
        components: {
          default: () => import("src/pages/authentication/verification/successful/index.vue"), topmenubar: DefaultMenuBar
        },
        props: {
          topmenubar: {
            hasBackButton: true, hasSettingsButton: true, hasCloseButton: false, hasLoginButton: false
          } as DefaultMenuBarProps
        },
        name: "verification-successful"
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
