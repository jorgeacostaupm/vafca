import { useCallback } from "react";
import type { ComponentType } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  removeNotification,
  selectQueuedNotifications,
} from "@/store/slices/notifications";
import {
  AntdNotificationPresenter,
  type UserNotificationPresenterProps,
} from "./UserNotificationPresenter";

type UserNotificationHostProps = {
  Presenter?: ComponentType<UserNotificationPresenterProps>;
};

export default function UserNotificationHost({
  Presenter = AntdNotificationPresenter,
}: UserNotificationHostProps) {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectQueuedNotifications);
  const handlePresented = useCallback(
    (id: string) => {
      dispatch(removeNotification(id));
    },
    [dispatch],
  );

  return <Presenter notifications={notifications} onPresented={handlePresented} />;
}
