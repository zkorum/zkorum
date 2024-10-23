import { useQuasar } from "quasar";
import { useRouter } from "vue-router";

export const useDialog = () => {

  const quasar = useQuasar();
  const router = useRouter();

  function showReportDialog(itemName: "post" | "comment") {
    quasar.dialog({
      title: "Thank you for the report",
      message: `Admins will investigate if the ${itemName} contains inappropriate content.`,
    });
  }

  function showContactUsSuccessfulDialog() {
    quasar.dialog({
      title: "Thank you for reaching out to us",
      message: "Our team will contact you through email after reviewing your message!",
    });
  }

  function showMessage(title: string, body: string) {
    quasar.dialog({
      title: title,
      message: body,
    });
  }


  function showLoginConfirmationDialog() {
    quasar.dialog({
      title: "Log in to Agora",
      message: "Sign in to participate the discussions",
      cancel: true,
      persistent: false
    }).onOk(() => {
      router.push({ name: "verification-options" });
    }).onCancel(() => {
      // console.log('>>>> Cancel')
    }).onDismiss(() => {
      // console.log('I am triggered on both OK and Cancel')
    });
  }

  return { showReportDialog, showContactUsSuccessfulDialog, showMessage, showLoginConfirmationDialog };
};
