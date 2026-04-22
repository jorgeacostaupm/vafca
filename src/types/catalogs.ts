import type { MatrixShape } from "@/types/matrix"
import type { MatrixOrderItem } from "@/types/matrixOrder"

export type ConnectivityMetadata = {
  atlas?: string
  atlasId?: string
  base?: string
  matrixOrder: MatrixOrderItem[]
  maxPopulations: number
  matrixShape?: MatrixShape
}

export type BandCatalogItem = {
  id: string
  label?: string
  min: number
  max: number
  description?: string
  enabled?: boolean
}

export type MeasureCatalogItem = {
  id: string
  label: string
  min?: number
  max?: number
  description?: string
  enabled?: boolean
}

export type StatCatalogItem = {
  id: string
  label: string
  min?: number
  max?: number
  description?: string
  enabled?: boolean
  useDataRange?: boolean
}

export type PopulationCatalogItem = {
  id: string
  label: string
  description?: string
  enabled?: boolean
}

export type ConnectivityCatalogs = {
  bands: Record<string, BandCatalogItem>
  measures: Record<string, MeasureCatalogItem>
  stats: Record<string, StatCatalogItem>
  populations: Record<string, PopulationCatalogItem>
}
