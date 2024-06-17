// This is just an example,
// so you can safely delete all default props below

export default {
  help: "Help",
  welcome: {
    login: "Login"
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
  }
};
