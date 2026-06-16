import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";

import {
  clearUploadedAtlasAndSync,
  uploadAtlasDefinitionAndSync,
} from "@/store/slices/atlasDefinition";
import {
  downloadCurrentDataset,
  loadDatasetFromUploadedZip,
} from "@/store/slices/dataset";
import { enqueueNotification } from "@/store/slices/notifications";
import { downloadSelectedLinks } from "@/store/slices/visualizationUi";
import { humanizeFieldName } from "@/utils/atlas/atlasDefinition";

export const userNotificationListenerMiddleware = createListenerMiddleware();

const getRejectedActionMessage = (action: unknown) => {
  if (!action || typeof action !== "object") return "The operation failed.";

  const payload = "payload" in action ? action.payload : null;
  if (typeof payload === "string") return payload;

  const error = "error" in action ? action.error : null;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "The operation failed.";
};

userNotificationListenerMiddleware.startListening({
  actionCreator: uploadAtlasDefinitionAndSync.fulfilled,
  effect: (action, { dispatch }) => {
    const { fileName, commonFields, atlas, compatibilityWarning } = action.payload;
    const totalNodes = atlas.nodes.length;

    const humanFields =
      commonFields.length > 0
        ? commonFields.map(humanizeFieldName).join(", ")
        : "no common scalar fields";

    dispatch(
      enqueueNotification({
        kind: compatibilityWarning ? "warning" : "success",
        message: compatibilityWarning ? "Atlas incompatible" : "Atlas loaded",
        description:
          compatibilityWarning ??
          `${fileName}: ${totalNodes} Nodes. Common fields: ${humanFields}.`,
      }),
    );
  },
});

userNotificationListenerMiddleware.startListening({
  matcher: isAnyOf(
    uploadAtlasDefinitionAndSync.rejected,
    downloadCurrentDataset.rejected,
    loadDatasetFromUploadedZip.rejected,
    downloadSelectedLinks.rejected,
  ),
  effect: (action, { dispatch }) => {
    dispatch(
      enqueueNotification({
        kind: "error",
        message: getRejectedActionMessage(action),
      }),
    );
  },
});

userNotificationListenerMiddleware.startListening({
  actionCreator: loadDatasetFromUploadedZip.fulfilled,
  effect: (action, { dispatch }) => {
    const {
      validNetworks,
      invalidNetworks,
      files,
      atlasCompatibilityWarning,
    } = action.payload;
    const invalidDescription =
      invalidNetworks > 0
        ? ` ${invalidNetworks} network entr${
            invalidNetworks === 1 ? "y was" : "ies were"
          } skipped because of validation errors.`
        : "";

    dispatch(
      enqueueNotification({
        kind:
          invalidNetworks > 0 || atlasCompatibilityWarning ? "warning" : "success",
        message: "Dataset loaded",
        description: `${validNetworks} valid network${
          validNetworks === 1 ? "" : "s"
        } loaded from ${files} ZIP file${
          files === 1 ? "" : "s"
        }.${invalidDescription}${
          atlasCompatibilityWarning ? ` ${atlasCompatibilityWarning}` : ""
        }`,
      }),
    );
  },
});

userNotificationListenerMiddleware.startListening({
  actionCreator: clearUploadedAtlasAndSync.fulfilled,
  effect: (_, { dispatch }) => {
    dispatch(
      enqueueNotification({
        kind: "success",
        message: "Uploaded atlas cleared",
        description: "Using the default atlas source.",
      }),
    );
  },
});

userNotificationListenerMiddleware.startListening({
  actionCreator: downloadCurrentDataset.fulfilled,
  effect: (action, { dispatch }) => {
    dispatch(
      enqueueNotification({
        kind: "success",
        message: "Dataset downloaded",
        description: action.payload.fileName,
      }),
    );
  },
});

userNotificationListenerMiddleware.startListening({
  actionCreator: downloadSelectedLinks.fulfilled,
  effect: (action, { dispatch }) => {
    const { failedNetworkIds, networksCount, linksCount } = action.payload;
    const partialWarning =
      failedNetworkIds.length > 0
        ? ` ${failedNetworkIds.length} network${
            failedNetworkIds.length === 1 ? "" : "s"
          } had missing values.`
        : "";

    dispatch(
      enqueueNotification({
        kind: failedNetworkIds.length > 0 ? "warning" : "success",
        message: "Selected links downloaded",
        description: `${linksCount} link${
          linksCount === 1 ? "" : "s"
        } with ${networksCount} network${networksCount === 1 ? "" : "s"}.${partialWarning}`,
      }),
    );
  },
});
