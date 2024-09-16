import { useShare } from "@vueuse/core";
import { Platform } from "quasar";

export function useWebShare() {

  const webShare = useShare();

  function isSupportedSharePlatform() {
    if (webShare.isSupported && !(Platform.is.firefox && Platform.is.desktop)) {
      return true;
    } else {
      console.log("Not a supported platform");
      return false;
    }
  }

  function share(title: string, url: string) {
    webShare.share({
      title: title,
      text: url,
      url: url
    });
  }

  return { isSupportedSharePlatform, share };
}