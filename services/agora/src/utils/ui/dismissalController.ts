type DismissHandler = () => Promise<void>;

export interface DismissalController {
  readonly dismiss: DismissHandler;
  readonly registerDismiss: (handler: DismissHandler) => () => void;
}

export function createDismissalController({
  fallbackDismiss,
}: {
  fallbackDismiss: DismissHandler;
}): DismissalController {
  const fallback = { handler: fallbackDismiss };
  let current = fallback;
  let state:
    | { kind: "idle" }
    | { kind: "dismissing"; completion: Promise<void> } = { kind: "idle" };

  function registerDismiss(handler: DismissHandler): () => void {
    const registration = { handler };
    current = registration;
    return () => {
      if (current === registration) current = fallback;
    };
  }

  async function dismiss(): Promise<void> {
    if (state.kind === "dismissing") {
      await state.completion;
      return;
    }
    const completion = current.handler();
    state = { kind: "dismissing", completion };
    try {
      await completion;
    } finally {
      state = { kind: "idle" };
    }
  }

  return { dismiss, registerDismiss };
}
