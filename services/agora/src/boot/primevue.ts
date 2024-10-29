import PrimeVue from "primevue/config";
import Aura from "@primevue/themes/aura";
import { boot } from "quasar/wrappers";

export default boot(({ app }) => {
  // something to do
  app.use(PrimeVue, {
    theme: {
      preset: Aura,
      options: {
        darkModeSelector: "light",
        cssLayer: false,
      },
    },
  });
});
