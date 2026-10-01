import { Alert, Card, Typography } from 'antd'

import CatalogManagementSections from '@/components/management/components/catalogs/CatalogManagementSections'
import { useAppSelector } from '@/store/hooks'
import {
  selectDatasetContent,
  selectDatasetError,
  selectDatasetStatus,
} from '@/store/slices/dataset'

export default function CatalogPanel() {
  const dataset = useAppSelector(selectDatasetContent)
  const status = useAppSelector(selectDatasetStatus)
  const error = useAppSelector(selectDatasetError)

  return (
    <Card title="Catalogs" classNames={{ body: 'catalog-management-page' }}>
      <Typography.Text type="secondary"></Typography.Text>
      {status === 'loading' ? (
        <Typography.Text role="status">Loading dataset...</Typography.Text>
      ) : status === 'error' ? (
        <Alert type="error" showIcon title={error ?? 'Unable to load dataset.'} />
      ) : dataset ? (
        <CatalogManagementSections />
      ) : (
        <Typography.Text type="secondary">Load a dataset to edit catalogs.</Typography.Text>
      )}
    </Card>
  )
}
