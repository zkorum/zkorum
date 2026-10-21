import { describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

import { useNotificationApi } from "./notification";

const fetchNotifications = vi.hoisted(() =>
  vi.fn<() => Promise<{ data: unknown }>>()
);
vi.mock("src/api", () => ({
  DefaultApiAxiosParamCreator: () => ({
    apiV1NotificationFetchPost: () => ({
      url: "/notification/fetch",
      options: {},
    }),
  }),
  DefaultApiFactory: () => ({ apiV1NotificationFetchPost: fetchNotifications }),
}));
vi.mock("../common", () => ({
  useCommonApi: () => ({ buildEncodedUcan: () => "token" }),
}));
vi.mock("../client", () => ({ api: {} }));
vi.mock("../../ui/notify", () => ({
  useNotify: () => ({ showNotifyMessage: vi.fn() }),
}));
vi.mock("src/composables/ui/useComponentI18n", () => ({
  useComponentI18n: () => ({ t: (key: string) => key }),
}));

describe("notification response parsing", () => {
  it("ignores additive response fields from a newer server", async () => {
    const response = {
      numNewNotifications: 0,
      notificationList: [],
      stickyNotificationList: [],
    };
    fetchNotifications.mockResolvedValue({
      data: { ...response, futureField: "new server field" },
    });
    await expect(
      useNotificationApi().fetchNotifications(undefined)
    ).resolves.toEqual(response);
  });

  it("still rejects invalid known notification data", async () => {
    fetchNotifications.mockResolvedValue({
      data: {
        numNewNotifications: 0,
        notificationList: [],
        stickyNotificationList: [{}],
      },
    });
    await expect(
      useNotificationApi().fetchNotifications(undefined)
    ).rejects.toBeInstanceOf(ZodError);
  });

  it("parses supported sticky notifications instead of dropping them", async () => {
    const createdAt = new Date("2026-10-21T12:00:00.000Z");
    const stickyNotification = {
      type: "security_add_email",
      slugId: "security",
      createdAt: createdAt.toISOString(),
      isRead: false,
      isSticky: true,
      routeTarget: { type: "settings" },
    };
    fetchNotifications.mockResolvedValue({
      data: {
        numNewNotifications: 0,
        notificationList: [],
        stickyNotificationList: [stickyNotification],
        futureField: "discard this",
      },
    });

    const response = await useNotificationApi().fetchNotifications(undefined);
    expect(response.stickyNotificationList).toEqual([
      { ...stickyNotification, createdAt },
    ]);
    expect(response).not.toHaveProperty("futureField");
  });
});
