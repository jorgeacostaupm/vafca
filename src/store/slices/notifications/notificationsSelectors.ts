import type { RootState } from "@/types/store";

export const selectQueuedNotifications = (state: RootState) => state.notifications.queue;
