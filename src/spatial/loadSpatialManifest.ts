import { z } from 'zod';

export const spatialPath = (path: string) => {
  if (!path || (/[\\:%?#]/.test(path) || [...path].some(char => char.charCodeAt(0) < 32)) || path.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new Error(`Invalid spatial resource path: ${path}`);
  }
  return `spatial/${path}`;
};

export const spatialManifestSchema = z.object({
  version: z.literal(1),
  coordinate_space: z.string().min(1).optional(),
  atlas: z.object({
    type: z.literal('surface-atlas'),
    format: z.literal('glb'),
    file: z.string().min(1),
    mapping: z.object({ roi_field: z.string().min(1), model_field: z.literal('name') }).strict(),
  }).strict().optional(),
}).strict();

export function loadSpatialManifest(files: Record<string, Uint8Array>) {
  const bytes = files['spatial/manifest.json'];
  if (!bytes) return null;
  const manifest = spatialManifestSchema.parse(JSON.parse(new TextDecoder().decode(bytes)));
  if (manifest.atlas && !files[spatialPath(manifest.atlas.file)]) {
    throw new Error(`Missing declared atlas file: ${spatialPath(manifest.atlas.file)}`);
  }
  return manifest;
}
