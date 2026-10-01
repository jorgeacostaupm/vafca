import { Button, Select } from 'antd';

import type { useLinksAtlasFocus } from './useLinksAtlasFocus';

export function LinksAtlasFocusControls({ focus }: { focus: ReturnType<typeof useLinksAtlasFocus> }) {
  return <div className="links-atlas__focus" role="group" aria-label="Filter 3D links">
    <Select className="links-atlas__focus-select" size="small" showSearch allowClear
      aria-label="Incident links for ROI" placeholder="All ROIs" optionFilterProp="label"
      value={focus.roi} options={focus.roiOptions} onChange={focus.setRoi} />
    <Select className="links-atlas__focus-select" size="small" allowClear
      aria-label="Module field" placeholder="Module field" value={focus.field}
      options={focus.fields.map(value => ({ value, label: value }))} onChange={focus.setField} />
    <Select className="links-atlas__focus-select" size="small" showSearch allowClear
      aria-label="Internal links for module" placeholder="All modules" optionFilterProp="label"
      disabled={!focus.field} value={focus.module}
      options={focus.modules.map(value => ({ value, label: value }))} onChange={focus.setModule} />
    <Button size="small" disabled={!focus.isFiltered && !focus.field} onClick={focus.reset}>Reset focus</Button>
  </div>;
}
