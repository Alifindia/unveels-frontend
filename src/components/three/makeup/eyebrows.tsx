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
  BLUSH_TEXTURE_FIVE,
  BLUSH_TEXTURE_FOUR,
  BLUSH_TEXTURE_ONE,
  BLUSH_TEXTURE_THREE,
  BLUSH_TEXTURE_TWO,
  EYEBROW_TEXTURE_EIGHT,
  EYEBROW_TEXTURE_FIVE,
  EYEBROW_TEXTURE_FOUR,
  EYEBROW_TEXTURE_ONE,
  EYEBROW_TEXTURE_SEVEN,
  EYEBROW_TEXTURE_SIX,
  EYEBROW_TEXTURE_THREE,
  EYEBROW_TEXTURE_TWO,
} from "../../../utils/constants";

interface EyebrowsProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
  isFlipped: boolean;
}

const EyebrowsInner: React.FC<EyebrowsProps> = ({
  landmarks,
  planeSize,
  isFlipped,
}) => {
  const { eyebrowsVisibility, eyebrowsPattern, eyebrowsColor } = useMakeup();

  // Memuat semua tekstur sekaligus
  const eyebrowsTextures = useLoader(TextureLoader, [
    EYEBROW_TEXTURE_ONE,
    EYEBROW_TEXTURE_TWO,
    EYEBROW_TEXTURE_THREE,
    EYEBROW_TEXTURE_FOUR,
    EYEBROW_TEXTURE_FIVE,
    EYEBROW_TEXTURE_SIX,
    EYEBROW_TEXTURE_SEVEN,
    EYEBROW_TEXTURE_EIGHT,
  ]);

  // Memilih tekstur yang sesuai berdasarkan blushPattern
  const alphaMap = eyebrowsTextures[eyebrowsPattern] || null;

  // Inisialisasi material dengan useMemo
  const eyebrowsMaterial = useMemo(() => {
    const materialOptions: Partial<MeshBasicMaterialParameters> = {
      color: new Color(eyebrowsColor),
      transparent: !!alphaMap,
    };

    if (alphaMap) {
      materialOptions.alphaMap = alphaMap;
      materialOptions.alphaTest = 0; // Sesuaikan alphaTest jika diperlukan
    }

    materialOptions.opacity = eyebrowsVisibility;
    console.log(eyebrowsVisibility);

    return new MeshBasicMaterial(materialOptions);
  }, [eyebrowsVisibility, alphaMap, eyebrowsColor]);

  return (
    <FaceMesh
      landmarks={landmarks}
      material={eyebrowsMaterial}
      planeSize={planeSize}
      flipHorizontal={isFlipped}
    />
  );
};

const Eyebrows: React.FC<EyebrowsProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <EyebrowsInner {...props} />
    </Suspense>
  );
};

export default Eyebrows;
