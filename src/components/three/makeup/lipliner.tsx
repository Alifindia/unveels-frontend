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
  LIPLINER_TEXTURE_SIX,
  LIPLINER_TEXTURE_FIVE,
  LIPLINER_TEXTURE_FOUR,
  LIPLINER_TEXTURE_ONE,
  LIPLINER_TEXTURE_THREE,
  LIPLINER_TEXTURE_TWO,
} from "../../../utils/constants";

interface LiplinerProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
  isFlipped: boolean;
}

const LiplinerInner: React.FC<LiplinerProps> = ({
  landmarks,
  planeSize,
  isFlipped,
}) => {
  const { liplinerColor, liplinerPattern } = useMakeup();

  // Memuat semua tekstur sekaligus
  const liplinerTextures = useLoader(TextureLoader, [
    LIPLINER_TEXTURE_ONE,
    LIPLINER_TEXTURE_TWO,
    LIPLINER_TEXTURE_THREE,
    LIPLINER_TEXTURE_FOUR,
    LIPLINER_TEXTURE_FIVE,
    LIPLINER_TEXTURE_SIX,
  ]);

  // Memilih tekstur yang sesuai berdasarkan blushPattern
  const alphaMap = liplinerTextures[liplinerPattern] || null;

  // Inisialisasi material dengan useMemo
  const liplinerMaterial = useMemo(() => {
    const materialOptions: Partial<MeshBasicMaterialParameters> = {
      color: new Color(liplinerColor),
      transparent: !!alphaMap, // Menjadikan transparan jika alphaMap digunakan
      opacity: 1,
    };

    if (alphaMap) {
      materialOptions.alphaMap = alphaMap;
      materialOptions.alphaTest = 0; // Sesuaikan alphaTest jika diperlukan
    }

    return new MeshBasicMaterial(materialOptions);
  }, [liplinerColor, alphaMap]);

  return (
    <FaceMesh
      landmarks={landmarks}
      material={liplinerMaterial}
      planeSize={planeSize}
      flipHorizontal={isFlipped}
    />
  );
};

const Lipliner: React.FC<LiplinerProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <LiplinerInner {...props} />
    </Suspense>
  );
};

export default Lipliner;
