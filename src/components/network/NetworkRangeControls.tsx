import { Checkbox, Radio, Space, Typography } from "antd";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectIncludeDiagonalInRanges,
  selectUiRangeMode,
  setIncludeDiagonalInRanges,
  setUiRangeMode,
} from "@/store/slices/visualizationUi";
import type { UiRangeMode } from "@/types/connectivityBundle";

export default function NetworkRangeControls() {
  const dispatch = useAppDispatch();
  const uiRangeMode = useAppSelector(selectUiRangeMode);
  const includeDiagonal = useAppSelector(selectIncludeDiagonalInRanges);

  return (
    <Space wrap size={16}>
      <Typography.Text>Range mode</Typography.Text>
      <Radio.Group
        size="small"
        value={uiRangeMode}
        aria-label="Range mode"
        onChange={(event) =>
          dispatch(setUiRangeMode(event.target.value as UiRangeMode))
        }
        options={[
          { value: "logical_default", label: "Logical default" },
          { value: "observed", label: "Observed range" },
        ]}
      />
      <Checkbox
        checked={includeDiagonal}
        onChange={(event) =>
          dispatch(setIncludeDiagonalInRanges(event.target.checked))
        }
      >
        Include diagonal
      </Checkbox>
    </Space>
  );
}
