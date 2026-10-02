import { ColorPicker, Form } from 'antd';

import SettingsActions from '@/components/common/SettingsActions';
import SettingsSection from '@/components/common/SettingsSection';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSpatialVisualStyle } from '@/store/slices/visualizationUi/visualizationUiSlice';
import type { SpatialVisualStyle } from '@/types/visualizationUi';

import { useSettingsDraft } from './useSettingsDraft';

const fields: [keyof SpatialVisualStyle, string][] = [
  ['nodeColor', 'Nodes'],
  ['divergingNodeColor', 'Nodes in diverging networks'],
  ['positiveLinkColor', 'Default / positive edges'],
  ['negativeLinkColor', 'Negative edges'],
  ['neutralLinkColor', 'Zero edges'],
];

export default function SpatialSettingsTab() {
  const dispatch = useAppDispatch();
  const applied = useAppSelector(state => state.visualizationUi.spatialVisualStyle);
  const { value: draft, patch, reset, hasChanges } = useSettingsDraft(applied);
  return (
    <SettingsSection description="Configure 3D brain views. Selected edges use the shared Node-Link selection color. Changes apply to all 3D link views.">
      <Form layout="vertical">
        {fields.map(([key, label]) => (
          <Form.Item key={key} label={label}>
            <ColorPicker value={draft[key]} onChange={color => patch({ [key]: color.toHexString() })} />
          </Form.Item>
        ))}
      </Form>
      <SettingsActions hasChanges={hasChanges}
        onApply={() => dispatch(setSpatialVisualStyle(draft))} onReset={reset} />
    </SettingsSection>
  );
}
