import { useQuasar } from "quasar";

export const useDialog = () => {

  const quasar = useQuasar();

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

  return { showReportDialog, showContactUsSuccessfulDialog, showMessage };
};
