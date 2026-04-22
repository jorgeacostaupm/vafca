import { useEffect, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import type { AtlasDefinition } from "@/types/atlas";

const atlasDefinitionCacheById = new Map<string, AtlasDefinition>();

export const useAtlasDefinition = (atlasId?: string) => {
  const uploadedAtlas = useAppSelector((state) => state.atlasDefinition.uploaded);
  const [atlasDefinition, setAtlasDefinition] = useState<AtlasDefinition | null>(() => {
    if (uploadedAtlas?.atlas) return uploadedAtlas.atlas;
    if (!atlasId) return null;
    return atlasDefinitionCacheById.get(atlasId) ?? null;
  });

  useEffect(() => {
    let active = true;
    if (uploadedAtlas?.atlas) {
      setAtlasDefinition(uploadedAtlas.atlas);
      if (uploadedAtlas.atlas.id) {
        atlasDefinitionCacheById.set(uploadedAtlas.atlas.id, uploadedAtlas.atlas);
      }
      return undefined;
    }
    if (!atlasId) {
      setAtlasDefinition(null);
      return undefined;
    }
    const cachedAtlas = atlasDefinitionCacheById.get(atlasId);
    if (cachedAtlas) {
      setAtlasDefinition(cachedAtlas);
      return undefined;
    }
    setAtlasDefinition(null);

    const loadAtlas = async () => {
      const response = await fetch(
        `${import.meta.env.BASE_URL}data/atlas_3d_no_mesh_points.json`,
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const atlasJson = (await response.json()) as AtlasDefinition;
      if (!active) return;
      if (atlasJson?.id && atlasJson.id !== atlasId) {
        setAtlasDefinition(null);
        return;
      }
      atlasDefinitionCacheById.set(atlasId, atlasJson);
      setAtlasDefinition(atlasJson);
    };

    loadAtlas().catch(() => {
      if (!active) return;
      setAtlasDefinition(null);
    });

    return () => {
      active = false;
    };
  }, [atlasId, uploadedAtlas]);

  return atlasDefinition;
};
