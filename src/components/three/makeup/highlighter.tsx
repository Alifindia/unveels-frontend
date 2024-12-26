import { MeshProps, useLoader } from "@react-three/fiber";
import React, { useMemo, Suspense } from "react";
import {
  Color,
  MeshBasicMaterial,
  MeshBasicMaterialParameters,
  TextureLoader,
} from "three";
import FaceMesh from "../face-mesh";
import { Landmark } from "../../../types/landmark";
import { useMakeup } from "../../../context/makeup-context";
import {
  HIGHLIGHTER_TEXTURE_FOUR,
  HIGHLIGHTER_TEXTURE_ONE,
  HIGHLIGHTER_TEXTURE_THREE,
  HIGHLIGHTER_TEXTURE_TWO,
} from "../../../utils/constants";

interface HighlighterProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
  isFlipped: boolean;
}

const HighlighterInner: React.FC<HighlighterProps> = ({
  landmarks,
  planeSize,
  isFlipped,
}) => {
  const { highlighterColor, highlighterPattern } = useMakeup();

  const highlighterTextures = useLoader(TextureLoader, [
    HIGHLIGHTER_TEXTURE_ONE,
    HIGHLIGHTER_TEXTURE_TWO,
    HIGHLIGHTER_TEXTURE_THREE,
    HIGHLIGHTER_TEXTURE_FOUR,
  ]);

  const alphaMap = highlighterTextures[highlighterPattern] || null;

  const HighlighterMaterial = useMemo(() => {
    const materialOptions: Partial<MeshBasicMaterialParameters> = {
      color: new Color(highlighterColor),
      transparent: !!alphaMap,
      opacity: 0.36,
    };

    if (alphaMap) {
      materialOptions.alphaMap = alphaMap;
      materialOptions.alphaTest = 0;
    }

    return new MeshBasicMaterial(materialOptions);
  }, [highlighterColor, alphaMap]);

  return (
    <FaceMesh
      landmarks={landmarks}
      material={HighlighterMaterial}
      planeSize={planeSize}
      flipHorizontal={isFlipped}
    />
  );
};

const Highlighter: React.FC<HighlighterProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <HighlighterInner {...props} />
    </Suspense>
  );
};

export default Highlighter;
