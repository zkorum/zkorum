import { useQuasar } from "quasar";

export const useDialog = () => {

  const quasar = useQuasar();

  function showReportDialog(itemName: "post" | "comment") {
    quasar.dialog({
      title: "Thank you for the report",
      message: `Admins will investigate if the ${itemName} contains inappropriate content.`,
    });
  }

  return { showReportDialog };
};
