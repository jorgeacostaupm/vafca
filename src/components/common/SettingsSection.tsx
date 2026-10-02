import { Typography } from 'antd'
import type { CSSProperties, ReactNode } from 'react'

type SettingsSectionProps = {
  title?: string
  titleFontSize?: CSSProperties['fontSize']
  description?: string
  actions?: ReactNode
  padded?: boolean
  children?: ReactNode
}

export default function SettingsSection({
  title,
  titleFontSize,
  description,
  actions,
  padded = true,
  children,
}: SettingsSectionProps) {
  const hasHeader = title || description || actions
  const sectionClassName = padded
    ? 'app-settings-section'
    : 'app-settings-section app-settings-section--no-padding'
  const titleClassName = titleFontSize
    ? 'app-settings-section__title app-settings-section__title--custom-size'
    : 'app-settings-section__title'
  const titleStyle = titleFontSize
    ? ({ '--app-settings-section-title-font-size': titleFontSize } as CSSProperties)
    : undefined

  return (
    <section className={sectionClassName}>
      {hasHeader ? (
        <div className="app-settings-section__header">
          <div>
            {title ? (
              <Typography.Title level={5} className={titleClassName} style={titleStyle}>
                {title}
              </Typography.Title>
            ) : null}
            {description ? (
              <Typography.Text type="secondary" className="app-settings-section__description">
                {description}
              </Typography.Text>
            ) : null}
          </div>
          {actions ? <div className="app-settings-section__actions">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}
