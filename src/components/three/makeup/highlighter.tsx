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

  // Memuat semua tekstur sekaligus
  const highlighterTextures = useLoader(TextureLoader, [
    HIGHLIGHTER_TEXTURE_ONE,
    HIGHLIGHTER_TEXTURE_TWO,
    HIGHLIGHTER_TEXTURE_THREE,
    HIGHLIGHTER_TEXTURE_FOUR,
  ]);

  // Memilih tekstur yang sesuai berdasarkan HighlighterPattern
  const alphaMap = highlighterTextures[highlighterPattern] || null;

  // Inisialisasi material dengan useMemo
  const HighlighterMaterial = useMemo(() => {
    const materialOptions: Partial<MeshBasicMaterialParameters> = {
      color: new Color(highlighterColor),
      transparent: !!alphaMap, // Menjadikan transparan jika alphaMap digunakan
      opacity: 1,
    };

    if (alphaMap) {
      materialOptions.alphaMap = alphaMap;
      materialOptions.alphaTest = 0; // Sesuaikan alphaTest jika diperlukan
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
