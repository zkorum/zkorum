// This is just an example,
// so you can safely delete all default props below

export default {
  help: "Help",
  welcome: {
    login: "Login"
  },
  boot: {
    capacitorStorage: {
      title: "Fatal error",
      message: "A fatal error occured while setting up secure storage. Try updating the app, or try again later. An error log has been sent to our server, we are onto it! We apologize for the inconvenience.",
      ok: "Close app",
    }
  },
  onboarding: {
    login: {
      title: "Join Your Community",
      email: {
        label: "ESSEC Email Address",
        hint: "such as name.surname{'@'}essec.edu", // to avoid Message compilation error: Unexpected empty linked key:  https://github.com/intlify/bundle-tools/issues/53#issuecomment-1879024073
        invalid: "Please provide a valid {'@'}essec.edu email address",
        unauthorized: "Please provide a valid {'@'}essec.edu email address",
      }
    }
  },
  capacitorStore: {
    secureLockScreenError: {
      title: "Secure storage error",
      message: "Agora requires you to enable a secure lock screen (PIN code, password, biometrics - not swipe)",
      ok: "Close app",
    },
    fatalError: {
      title: "Secure storage error",
      message: "Fatal error while trying to access secure storage",
      ok: "Close app",
    },

  }
};