import { afterEach, expect, it } from "vitest";
import { type App, createApp, h, nextTick } from "vue";

import ZKCard from "./ZKCard.vue";

const apps: App[] = [];
afterEach(() => {
  for (const app of apps.splice(0)) app.unmount();
  document.body.replaceChildren();
});

it("provides the native card element through its typed default slot", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  let slotElement: HTMLElement | undefined;
  const app = createApp({
    render: () =>
      h(
        ZKCard,
        { padding: "0rem" },
        {
          default: ({ element }: { element: HTMLElement | undefined }) => {
            slotElement = element;
            return h("span", "Card content");
          },
        }
      ),
  });
  apps.push(app);
  app.mount(host);
  await nextTick();
  expect(slotElement).toBe(host.firstElementChild);
  expect(slotElement?.textContent).toBe("Card content");
});
