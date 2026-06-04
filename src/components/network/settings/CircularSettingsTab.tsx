import { Button, ColorPicker, Form, Slider, Space, Switch, Typography } from "antd";
import type { Color } from "antd/es/color-picker";
import { useMemo, useState } from "react";

import { useManagementHierarchy } from "@/components/management/hooks/useManagementHierarchy";
import {
  DEFAULT_CIRCULAR_NEGATIVE_LINK_COLOR,
  DEFAULT_CIRCULAR_POSITIVE_LINK_COLOR,
} from "@/config/matrixColorScales";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectDatasetData } from "@/store/slices/dataset";
import {
  selectNetworkControls,
  setNetworkCircularEdgeSettings,
} from "@/store/slices/networkVisualization";
import {
  DEFAULT_CIRCULAR_BUNDLING_ENABLED,
  DEFAULT_CIRCULAR_LINK_TENSION,
} from "@/types/circular";
import { getDatasetAtlasId } from "@/utils/datasetAccessors";

import CircularLabelOrderingSection from "./CircularLabelOrderingSection";
import HierarchySettingsPreview from "./hierarchy/HierarchySettingsPreview";
import SettingsSection from "./SettingsSection";

const TENSION_MARKS = {
  0: "0",
  0.5: "0.5",
  1: "1",
};

type CircularEdgeDraft = {
  baseLinkTension: number;
  baseBundlingEnabled: boolean;
  basePositiveLinkColor: string;
  baseNegativeLinkColor: string;
  linkTension: number;
  bundlingEnabled: boolean;
  positiveLinkColor: string;
  negativeLinkColor: string;
};

const normalizeTension = (value: number | [number, number]) =>
  Array.isArray(value) ? value[0] : value;

const toHexColor = (color: Color, fallback: string) => color.toHexString() || fallback;

const areCircularEdgeSettingsEqual = (
  first: Pick<
    CircularEdgeDraft,
    "linkTension" | "bundlingEnabled" | "positiveLinkColor" | "negativeLinkColor"
  >,
  second: Pick<
    CircularEdgeDraft,
    "linkTension" | "bundlingEnabled" | "positiveLinkColor" | "negativeLinkColor"
  >,
) =>
  first.linkTension === second.linkTension &&
  first.bundlingEnabled === second.bundlingEnabled &&
  first.positiveLinkColor === second.positiveLinkColor &&
  first.negativeLinkColor === second.negativeLinkColor;

export default function CircularSettingsTab() {
  const dispatch = useAppDispatch();
  const controls = useAppSelector(selectNetworkControls);
  const dataset = useAppSelector((state) => selectDatasetData(state));
  const atlas = useAppSelector((state) => state.atlasUi);
  const atlasDefinition = useAtlasDefinition(getDatasetAtlasId(dataset));
  const hierarchy = useManagementHierarchy({
    atlas,
    atlasDefinition,
    syncCategoryOrder: false,
  });
  const appliedSettings = useMemo(
    () => ({
      linkTension: controls.circularLinkTension ?? DEFAULT_CIRCULAR_LINK_TENSION,
      bundlingEnabled:
        controls.circularBundlingEnabled ?? DEFAULT_CIRCULAR_BUNDLING_ENABLED,
      positiveLinkColor:
        controls.circularPositiveLinkColor ?? DEFAULT_CIRCULAR_POSITIVE_LINK_COLOR,
      negativeLinkColor:
        controls.circularNegativeLinkColor ?? DEFAULT_CIRCULAR_NEGATIVE_LINK_COLOR,
    }),
    [
      controls.circularBundlingEnabled,
      controls.circularLinkTension,
      controls.circularNegativeLinkColor,
      controls.circularPositiveLinkColor,
    ],
  );
  const [draft, setDraft] = useState<CircularEdgeDraft>(() => ({
    baseLinkTension: appliedSettings.linkTension,
    baseBundlingEnabled: appliedSettings.bundlingEnabled,
    basePositiveLinkColor: appliedSettings.positiveLinkColor,
    baseNegativeLinkColor: appliedSettings.negativeLinkColor,
    ...appliedSettings,
  }));
  const appliedStateChanged = !areCircularEdgeSettingsEqual(
    {
      linkTension: draft.baseLinkTension,
      bundlingEnabled: draft.baseBundlingEnabled,
      positiveLinkColor: draft.basePositiveLinkColor,
      negativeLinkColor: draft.baseNegativeLinkColor,
    },
    appliedSettings,
  );
  const effectiveSettings = appliedStateChanged ? appliedSettings : draft;
  const hasPendingChanges = !areCircularEdgeSettingsEqual(
    effectiveSettings,
    appliedSettings,
  );

  const patchDraft = (
    patch: Partial<
      Pick<
        CircularEdgeDraft,
        "linkTension" | "bundlingEnabled" | "positiveLinkColor" | "negativeLinkColor"
      >
    >,
  ) => {
    setDraft({
      baseLinkTension: appliedSettings.linkTension,
      baseBundlingEnabled: appliedSettings.bundlingEnabled,
      basePositiveLinkColor: appliedSettings.positiveLinkColor,
      baseNegativeLinkColor: appliedSettings.negativeLinkColor,
      linkTension: effectiveSettings.linkTension,
      bundlingEnabled: effectiveSettings.bundlingEnabled,
      positiveLinkColor: effectiveSettings.positiveLinkColor,
      negativeLinkColor: effectiveSettings.negativeLinkColor,
      ...patch,
    });
  };

  const handleReset = () => {
    setDraft({
      baseLinkTension: appliedSettings.linkTension,
      baseBundlingEnabled: appliedSettings.bundlingEnabled,
      basePositiveLinkColor: appliedSettings.positiveLinkColor,
      baseNegativeLinkColor: appliedSettings.negativeLinkColor,
      ...appliedSettings,
    });
  };

  const handleApply = () => {
    dispatch(
      setNetworkCircularEdgeSettings({
        linkTension: effectiveSettings.linkTension,
        bundlingEnabled: effectiveSettings.bundlingEnabled,
        positiveLinkColor: effectiveSettings.positiveLinkColor,
        negativeLinkColor: effectiveSettings.negativeLinkColor,
      }),
    );
  };

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <SettingsSection
        title="Color & Edges"
        actions={
          <Space>
            <Button disabled={!hasPendingChanges} onClick={handleReset}>
              Reset
            </Button>
            <Button type="primary" disabled={!hasPendingChanges} onClick={handleApply}>
              Apply
            </Button>
          </Space>
        }
      >
        <div className="circular-settings-edges">
          <Form layout="vertical" className="circular-settings-edges__form">
            <Form.Item label="Hierarchical edge bundling">
              <Switch
                checked={effectiveSettings.bundlingEnabled}
                onChange={(value) => patchDraft({ bundlingEnabled: value })}
              />
            </Form.Item>
            <div className="circular-settings-edges__colors">
              <Form.Item
                label="Positive links"
                className="circular-settings-edges__color-item"
              >
                <ColorPicker
                  value={effectiveSettings.positiveLinkColor}
                  onChange={(color) =>
                    patchDraft({
                      positiveLinkColor: toHexColor(
                        color,
                        effectiveSettings.positiveLinkColor,
                      ),
                    })
                  }
                />
              </Form.Item>
              <Form.Item
                label="Negative links"
                className="circular-settings-edges__color-item"
              >
                <ColorPicker
                  value={effectiveSettings.negativeLinkColor}
                  onChange={(color) =>
                    patchDraft({
                      negativeLinkColor: toHexColor(
                        color,
                        effectiveSettings.negativeLinkColor,
                      ),
                    })
                  }
                />
              </Form.Item>
            </div>
          </Form>

          <div className="circular-settings-edges__preview-panel">
            <HierarchySettingsPreview
              mode="circular"
              hierarchy={hierarchy}
              circularLinkTension={effectiveSettings.linkTension}
              circularBundlingEnabled={effectiveSettings.bundlingEnabled}
              circularLinkColor={effectiveSettings.positiveLinkColor}
            />
            <Form layout="vertical" className="circular-settings-edges__tension">
              <Form.Item
                label={
                  <Space size={8}>
                    <Typography.Text>Link tension</Typography.Text>
                    <Typography.Text type="secondary">
                      {effectiveSettings.linkTension.toFixed(2)}
                    </Typography.Text>
                  </Space>
                }
                style={{ marginBottom: 0 }}
              >
                <Slider
                  min={0}
                  max={1}
                  step={0.05}
                  marks={TENSION_MARKS}
                  value={effectiveSettings.linkTension}
                  disabled={!effectiveSettings.bundlingEnabled}
                  onChange={(value) =>
                    patchDraft({ linkTension: normalizeTension(value) })
                  }
                />
              </Form.Item>
            </Form>
          </div>
        </div>
      </SettingsSection>

      <CircularLabelOrderingSection />
    </Space>
  );
}
