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
} from "../../../utils/constants";

interface BlushProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
  isFlipped: boolean;
}

const BlushInner: React.FC<BlushProps> = ({
  landmarks,
  planeSize,
  isFlipped,
}) => {
  const { blushColor, blushPattern } = useMakeup();

  // Memuat semua tekstur sekaligus
  const blushTextures = useLoader(TextureLoader, [
    BLUSH_TEXTURE_ONE,
    BLUSH_TEXTURE_TWO,
    BLUSH_TEXTURE_THREE,
    BLUSH_TEXTURE_FOUR,
    BLUSH_TEXTURE_FIVE,
  ]);

  // Memilih tekstur yang sesuai berdasarkan blushPattern
  const alphaMap = blushTextures[blushPattern] || null;

  // Inisialisasi material dengan useMemo
  const blushMaterial = useMemo(() => {
    const materialOptions: Partial<MeshBasicMaterialParameters> = {
      color: new Color(blushColor),
      transparent: !!alphaMap, // Menjadikan transparan jika alphaMap digunakan
      opacity: 1,
    };

    if (alphaMap) {
      materialOptions.alphaMap = alphaMap;
      materialOptions.alphaTest = 0; // Sesuaikan alphaTest jika diperlukan
    }

    return new MeshBasicMaterial(materialOptions);
  }, [blushColor, alphaMap]);

  return (
    <FaceMesh
      landmarks={landmarks}
      material={blushMaterial}
      planeSize={planeSize}
      flipHorizontal={isFlipped}
    />
  );
};

const Blush: React.FC<BlushProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <BlushInner {...props} />
    </Suspense>
  );
};

export default Blush;
