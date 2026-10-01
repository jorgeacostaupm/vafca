export const DEFAULT_ATLAS_STATUS_ID = '__default_atlas__'

export const buildPublicDataUrl = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`

export const getUploadAtlasErrorMessage = (error: unknown) => {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (
    error &&
    typeof error === 'object' &&
    'error' in error &&
    typeof error.error === 'string'
  ) {
    return error.error
  }
  return 'Failed to upload atlas.'
}
