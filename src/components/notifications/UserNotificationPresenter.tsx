import { notification as antdNotification } from "antd";
import type {
  NotificationInstance,
  NotificationPlacement,
} from "antd/es/notification/interface";
import { useEffect } from "react";

import type { UserNotification } from "@/store/slices/notifications";

type UserNotificationPresenterProps = {
  notifications: UserNotification[];
  onPresented: (id: string) => void;
};

const DEFAULT_NOTIFICATION_PLACEMENT: NotificationPlacement = "bottomRight";

const presentWithAntdNotification = (
  notificationApi: NotificationInstance,
  notification: UserNotification,
) => {
  notificationApi.open({
    key: notification.id,
    type: notification.kind,
    message: notification.message,
    description: notification.description,
    duration: notification.durationSeconds,
    placement: DEFAULT_NOTIFICATION_PLACEMENT,
  });
};

export function AntdNotificationPresenter({
  notifications,
  onPresented,
}: UserNotificationPresenterProps) {
  const [notificationApi, contextHolder] = antdNotification.useNotification({
    placement: DEFAULT_NOTIFICATION_PLACEMENT,
  });

  useEffect(() => {
    notifications.forEach((notification) => {
      presentWithAntdNotification(notificationApi, notification);
      onPresented(notification.id);
    });
  }, [notificationApi, notifications, onPresented]);

  return contextHolder;
}

export type { UserNotificationPresenterProps };
