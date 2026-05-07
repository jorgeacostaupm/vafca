export type UserNotificationKind = "success" | "info" | "warning" | "error";

export type UserNotification = {
  id: string;
  kind: UserNotificationKind;
  message: string;
  description?: string;
  durationSeconds?: number;
};

export type UserNotificationDraft = Omit<UserNotification, "id"> & {
  id?: string;
};

export type NotificationsSliceState = {
  queue: UserNotification[];
};

export const initialNotificationsState: NotificationsSliceState = {
  queue: [],
};
