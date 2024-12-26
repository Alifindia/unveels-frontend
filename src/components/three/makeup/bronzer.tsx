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
  BRONZER_TEXTURE_ONE,
  BRONZER_TEXTURE_TWO,
  BRONZER_TEXTURE_THREE,
  BRONZER_TEXTURE_FOUR,
  BRONZER_TEXTURE_FIVE,
} from "../../../utils/constants";

interface BronzerProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
  isFlipped: boolean;
}

const BronzerInner: React.FC<BronzerProps> = ({
  landmarks,
  planeSize,
  isFlipped,
}) => {
  const { bronzerColor, bronzerPattern } = useMakeup();

  // Memuat semua tekstur sekaligus
  const bronzerTextures = useLoader(TextureLoader, [
    BRONZER_TEXTURE_ONE,
    BRONZER_TEXTURE_TWO,
    BRONZER_TEXTURE_THREE,
    BRONZER_TEXTURE_FOUR,
    BRONZER_TEXTURE_FIVE,
  ]);

  // Memilih tekstur yang sesuai berdasarkan HighlighterPattern
  const alphaMap = bronzerTextures[bronzerPattern] || null;

  // Inisialisasi material dengan useMemo
  const bronzerMaterial = useMemo(() => {
    const materialOptions: Partial<MeshBasicMaterialParameters> = {
      color: new Color(bronzerColor),
      transparent: !!alphaMap, // Menjadikan transparan jika alphaMap digunakan
      opacity: 0.73,
    };

    if (alphaMap) {
      materialOptions.alphaMap = alphaMap;
      materialOptions.alphaTest = 0; // Sesuaikan alphaTest jika diperlukan
    }

    return new MeshBasicMaterial(materialOptions);
  }, [bronzerColor, alphaMap]);

  return (
    <FaceMesh
      landmarks={landmarks}
      material={bronzerMaterial}
      planeSize={planeSize}
      flipHorizontal={isFlipped}
    />
  );
};

const Bronzer: React.FC<BronzerProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <BronzerInner {...props} />
    </Suspense>
  );
};

export default Bronzer;
