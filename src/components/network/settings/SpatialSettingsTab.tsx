import { Button, ColorPicker, Form } from 'antd';
import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSpatialVisualStyle } from '@/store/slices/visualizationUi/visualizationUiSlice';
import type { SpatialVisualStyle } from '@/types/visualizationUi';

import SettingsSection from './SettingsSection';

const fields: [keyof SpatialVisualStyle, string][] = [
  ['nodeColor', 'Nodes'], ['divergingNodeColor', 'Nodes in diverging networks'],
  ['positiveLinkColor', 'Default / positive edges'], ['negativeLinkColor', 'Negative edges'],
  ['neutralLinkColor', 'Zero edges'],
];

export default function SpatialSettingsTab() {
  const dispatch = useAppDispatch();
  const applied = useAppSelector(state => state.visualizationUi.spatialVisualStyle);
  const [draft, setDraft] = useState(applied);
  return <SettingsSection description="Configure 3D brain views. Selected edges use the shared Node-Link selection color. Changes apply to all 3D link views.">
    <Form layout="vertical">
      {fields.map(([key, label]) => <Form.Item key={key} label={label}>
        <ColorPicker value={draft[key]} onChange={color => setDraft({ ...draft, [key]: color.toHexString() })} />
      </Form.Item>)}
    </Form>
    <Button type="primary" onClick={() => dispatch(setSpatialVisualStyle(draft))}>Apply</Button>{' '}
    <Button onClick={() => setDraft(applied)}>Reset</Button>
  </SettingsSection>;
}
