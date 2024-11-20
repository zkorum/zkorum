import { defineBoot } from "#q-app/wrappers";
import { createI18n } from "vue-i18n";
import { Quasar } from "quasar";

import messages from "src/i18n";

export type MessageLanguages = keyof typeof messages;
// Type-define 'en-US' as the master schema for the resource
export type MessageSchema = (typeof messages)["en-US"];

// See https://vue-i18n.intlify.dev/guide/advanced/typescript.html#global-resource-schema-type-definition
/* eslint-disable @typescript-eslint/no-empty-interface */
declare module "vue-i18n" {
  // define the locale messages schema
  export interface DefineLocaleMessage extends MessageSchema {}

  // define the datetime format schema
  export interface DefineDateTimeFormat {}

  // define the number format schema
  export interface DefineNumberFormat {}
}
/* eslint-enable @typescript-eslint/no-empty-interface */

function loadAndConfigureI18n() {
  const fallbackLocale = "en-US";
  let defaultLocale = fallbackLocale;
  const detectedLang = Quasar.lang.getLocale();
  if (detectedLang !== undefined) {
    defaultLocale = detectedLang;
  }
  const i18n = createI18n({
    locale: defaultLocale,
    fallbackLocale: fallbackLocale,
    legacy: false,
    messages,
  });
  return i18n;
}

export const i18n = loadAndConfigureI18n();

export default defineBoot(({ app }) => {
  app.use(i18n);
});
