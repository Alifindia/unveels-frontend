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
  LASHES_FIVE,
  LASHES_FOUR,
  LASHES_ONE,
  LASHES_SEVEN,
  LASHES_SIX,
  LASHES_THREE,
  LASHES_TWO,
  LASHES_EIGHT,
  LASHES_NINE,
} from "../../../utils/constants";

interface LashesProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
  isFlipped: boolean;
}

const LashesInner: React.FC<LashesProps> = ({
  landmarks,
  planeSize,
  isFlipped,
}) => {
  const { lashesPattern, lashesColor } = useMakeup();

  const lashesTextures = useLoader(TextureLoader, [
    LASHES_ONE,
    LASHES_TWO,
    LASHES_THREE,
    LASHES_FOUR,
    LASHES_FIVE,
    LASHES_SIX,
    LASHES_SEVEN,
    LASHES_EIGHT,
    LASHES_NINE,
  ]);

  const alphaMap = lashesTextures[lashesPattern] || null;

  const lashesMaterial = useMemo(() => {
    console.log(lashesPattern);

    const materialOptions: Partial<MeshBasicMaterialParameters> = {
      color: new Color(lashesColor),
      transparent: !!alphaMap,
      opacity: 0.3,
    };

    if (alphaMap) {
      materialOptions.alphaMap = alphaMap;
      materialOptions.alphaTest = 0;
    }

    return new MeshBasicMaterial(materialOptions);
  }, [lashesColor, alphaMap]);
  
  return (
    <FaceMesh
      landmarks={landmarks}
      material={lashesMaterial}
      planeSize={planeSize}
      flipHorizontal={isFlipped}
    />
  );
};

const Lashes: React.FC<LashesProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <LashesInner {...props} />
    </Suspense>
  );
};

export default Lashes;
