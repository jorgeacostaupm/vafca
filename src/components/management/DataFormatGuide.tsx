import { Drawer, Typography } from 'antd'
import { marked } from 'marked'
import { useState } from 'react'

import { DATA_FORMAT_GUIDE_WIDTH } from '@/config/ui'

import dataLoadingGuide from '../../../docs/data-loading.md?raw'

// ponytail: render only this bundled, repository-owned document; sanitize before accepting external Markdown.
const guideHtml = marked.parse(dataLoadingGuide, { async: false })

export default function DataFormatGuide() {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <Typography.Paragraph>
        Read{' '}
        <button
          type="button"
          className="data-management-guide-link"
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          here
        </button>{' '}
        the data format specification required by VAFCA
      </Typography.Paragraph>
      <Drawer
        title="Data format specification"
        open={open}
        onClose={() => setOpen(false)}
        size={DATA_FORMAT_GUIDE_WIDTH}
        destroyOnHidden
      >
        <article
          className="data-management-guide"
          dangerouslySetInnerHTML={{ __html: guideHtml }}
        />
      </Drawer>
    </div>
  )
}
