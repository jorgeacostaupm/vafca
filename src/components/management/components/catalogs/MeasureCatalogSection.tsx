import { CheckOutlined } from "@ant-design/icons";
import { Button, Card, Input, InputNumber, Space, Switch, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";

import { useCatalogItemUpdater } from "@/components/management/components/catalogs/useCatalogItemUpdater";
import {
  isEnabled,
  normalizeNumber,
} from "@/components/management/utils/catalogValues";
import { useAppSelector } from "@/store/hooks";
import { selectDatasetContent } from "@/store/slices/dataset";
import type { Measure } from "@/types/network";

type MeasureDraft = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  min?: number;
  max?: number;
};

type EditableMeasure = Measure & { enabled?: boolean };

const toDraft = (measure: EditableMeasure): MeasureDraft => ({
  id: measure.id,
  label: measure.label ?? "",
  description: measure.description ?? "",
  enabled: isEnabled(measure),
  min: measure.expectedRange?.[0] ?? measure.valueDomain?.min ?? undefined,
  max: measure.expectedRange?.[1] ?? measure.valueDomain?.max ?? undefined,
});

const toDrafts = (measures: Record<string, EditableMeasure>) =>
  Object.fromEntries(
    Object.values(measures).map((measure) => [measure.id, toDraft(measure)]),
  );

const draftsAreEqual = (
  draft: MeasureDraft | undefined,
  measure: EditableMeasure,
) => {
  if (!draft) return false;
  const baseline = toDraft(measure);
  return (
    draft.label === baseline.label &&
    draft.description === baseline.description &&
    draft.enabled === baseline.enabled &&
    draft.min === baseline.min &&
    draft.max === baseline.max
  );
};

const hasInvalidRange = (draft: MeasureDraft) =>
  draft.min !== undefined && draft.max !== undefined && draft.min > draft.max;

function MeasureCatalogSection() {
  const updateItem = useCatalogItemUpdater();
  const measures = useAppSelector(
    (state) => selectDatasetContent(state)?.catalogs.measures ?? {},
  );
  const [drafts, setDrafts] = useState<Record<string, MeasureDraft>>(() =>
    toDrafts(measures),
  );

  useEffect(() => {
    setDrafts(toDrafts(measures));
  }, [measures]);

  const measureItems = useMemo(() => Object.values(measures), [measures]);
  const dirtyMeasures = measureItems.filter(
    (measure) => !draftsAreEqual(drafts[measure.id], measure),
  );
  const invalidRange = Object.values(drafts).some(hasInvalidRange);
  const canSave = dirtyMeasures.length > 0 && !invalidRange;

  const updateDraft = (id: string, changes: Partial<MeasureDraft>) => {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        ...changes,
      },
    }));
  };

  const handleSave = () => {
    dirtyMeasures.forEach((measure) => {
      const draft = drafts[measure.id];
      if (!draft) return;
      updateItem("measures", measure.id, {
        label: draft.label,
        description: draft.description,
        enabled: draft.enabled,
        min: draft.min,
        max: draft.max,
        expectedRange:
          draft.min !== undefined && draft.max !== undefined
            ? [draft.min, draft.max]
            : null,
      });
    });
  };

  return (
    <div className="catalog-management-section">
      <div className="catalog-management-grid">
        {measureItems.map((measure) => {
          const draft = drafts[measure.id] ?? toDraft(measure);

          return (
            <Card key={measure.id} size="small" className="catalog-management-card">
              <Space direction="vertical" size={8} className="catalog-management-card__body">
                <Space wrap size={12} align="start">
                  <Input
                    size="small"
                    placeholder="Measure label"
                    value={draft.label}
                    className="catalog-management-label-input"
                    onChange={(event) =>
                      updateDraft(measure.id, {
                        label: event.target.value,
                      })
                    }
                  />
                  <Switch
                    checked={draft.enabled}
                    onChange={(checked) =>
                      updateDraft(measure.id, {
                        enabled: checked,
                      })
                    }
                  />
                  <InputNumber
                    size="small"
                    placeholder="Min"
                    value={draft.min ?? null}
                    onChange={(value) =>
                      updateDraft(measure.id, {
                        min: normalizeNumber(value),
                      })
                    }
                  />
                  <InputNumber
                    size="small"
                    placeholder="Max"
                    value={draft.max ?? null}
                    onChange={(value) =>
                      updateDraft(measure.id, {
                        max: normalizeNumber(value),
                      })
                    }
                  />
                </Space>

                <Input.TextArea
                  size="small"
                  placeholder="Description"
                  value={draft.description}
                  onChange={(event) =>
                    updateDraft(measure.id, {
                      description: event.target.value,
                    })
                  }
                  className="catalog-management-description"
                />
              </Space>
            </Card>
          );
        })}
      </div>
      <div className="catalog-management-actions">
        {invalidRange ? (
          <Typography.Text type="danger">
            Min must be less than or equal to max.
          </Typography.Text>
        ) : null}
        <Button
          size="small"
          type="primary"
          icon={<CheckOutlined />}
          disabled={!canSave}
          onClick={handleSave}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}

export default MeasureCatalogSection;
