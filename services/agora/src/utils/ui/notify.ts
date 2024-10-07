import { useQuasar } from "quasar";

export const useNotify = () => {

  const quasar = useQuasar();

  function showNotifyMessage(message: string) {
    quasar.notify({
      message: message,
    });
  }

  return { showNotifyMessage };
};
