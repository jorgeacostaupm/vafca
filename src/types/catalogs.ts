import type { MatrixOrderItem } from "@/types/matrixOrder"
import type {
  ExpectedRange,
  RangeMode,
  ScaleType,
} from "@/types/connectivityBundle"

export type ConnectivityMetadata = {
  atlas?: string
  atlasId?: string
  base?: string
  matrixOrder: MatrixOrderItem[]
  maxPopulations: number
}

export type LayerCatalogItem = {
  id: string
  label?: string
  description?: string | null
  enabled?: boolean
}

export type MeasureCatalogItem = {
  id: string
  label: string
  min?: number
  max?: number
  expectedRange?: ExpectedRange
  description?: string | null
  enabled?: boolean
}

export type StatCatalogItem = {
  id: string
  label: string
  category?: string
  min?: number
  max?: number
  scaleType?: ScaleType
  center?: number | null
  rangeMode?: RangeMode
  expectedRange?: ExpectedRange
  description?: string | null
  enabled?: boolean
  useDataRange?: boolean
}

export type PopulationCatalogItem = {
  id: string
  label: string
  description?: string | null
  enabled?: boolean
}

export type ConnectivityCatalogs = {
  layers: Record<string, LayerCatalogItem>
  measures: Record<string, MeasureCatalogItem>
  stats: Record<string, StatCatalogItem>
  populations: Record<string, PopulationCatalogItem>
}
