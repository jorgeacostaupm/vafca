import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

import {
  initialNotificationsState,
  type UserNotification,
  type UserNotificationDraft,
} from "./notificationsTypes";

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: initialNotificationsState,
  reducers: {
    enqueueNotification: {
      reducer(state, action: PayloadAction<UserNotification>) {
        state.queue.push(action.payload);
      },
      prepare(notification: UserNotificationDraft) {
        return {
          payload: {
            ...notification,
            id: notification.id ?? nanoid(),
          },
        };
      },
    },
    removeNotification(state, action: PayloadAction<string>) {
      state.queue = state.queue.filter((notification) => notification.id !== action.payload);
    },
    clearNotifications(state) {
      state.queue = [];
    },
  },
});

export const {
  clearNotifications,
  enqueueNotification,
  removeNotification,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
