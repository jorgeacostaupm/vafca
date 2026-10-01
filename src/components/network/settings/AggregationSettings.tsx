import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setAggregationFields } from '@/store/slices/atlasUi'

import OrderingFieldsSelect from './OrderingFieldsSelect'

export default function AggregationSettings() {
  const dispatch = useAppDispatch()
  const fields = useAppSelector(state => state.atlasUi.aggregationFields)
  return <OrderingFieldsSelect purpose="Aggregation" fields={fields}
    onChange={next => dispatch(setAggregationFields(next))} />
}
