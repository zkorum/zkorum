import { useShare } from "@vueuse/core";
import { Platform } from "quasar";
import { useClipboard } from "@vueuse/core";
import { useDialog } from "../ui/dialog";

export function useWebShare() {

  const webShare = useShare();
  const clipBoard = useClipboard();
  const dialog = useDialog();

  function isSupportedSharePlatform() {
    if (webShare.isSupported && !(Platform.is.firefox && Platform.is.desktop)) {
      return true;
    } else {
      console.log("Not a supported web share platform");
      return false;
    }
  }

  async function share(title: string, url: string) {
    if (isSupportedSharePlatform()) {
      webShare.share({
        title: title,
        text: url,
        url: url
      });
    } else {
      if (clipBoard.isSupported) {
        await clipBoard.copy(url);
        dialog.showMessage("Clipboard", "Successfully copied to the clipboard!");
      } else {
        console.log("Clipboard is not supported");
        dialog.showMessage("Share Link", url);
      }
    }
  }

  return { share };
}
