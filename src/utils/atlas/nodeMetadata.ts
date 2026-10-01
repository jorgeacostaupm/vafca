import { z } from 'zod'

export const parseMetadataValue = (text: string, original: unknown): unknown => {
  if (typeof original === 'string') return text
  const value: unknown = z.json().parse(JSON.parse(text))
  const kind = (item: unknown) => item === null ? 'null' : Array.isArray(item) ? 'array' : typeof item
  if (kind(value) !== kind(original)) throw new Error(`Expected ${kind(original)}.`)
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Expected a finite number.')
  return value
}

// Legacy tags are accepted at import only; all application state uses metadata.
export const NodeMetadataSchema = z.object({
  tags: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).superRefine(({ tags, metadata }, ctx) => {
  for (const [key, value] of Object.entries(tags ?? {})) {
    if (metadata && Object.hasOwn(metadata, key) && JSON.stringify(metadata[key]) !== JSON.stringify(value)) {
      ctx.addIssue({ code: 'custom', path: ['metadata', key], message: `Conflicting tags and metadata values for ${key}.` })
    }
  }
}).transform(({ tags, metadata }) => ({ ...tags, ...metadata }))
