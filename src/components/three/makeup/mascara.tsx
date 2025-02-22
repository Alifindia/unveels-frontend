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

interface MascaraProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
  isFlipped: boolean;
}

const MascaraInner: React.FC<MascaraProps> = ({
  landmarks,
  planeSize,
  isFlipped,
}) => {
  const { mascaraColor } = useMakeup();

  const mascaraTextures = useLoader(TextureLoader, [
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

  const alphaMap = mascaraTextures[1] || null;

  const mascaraMaterial = useMemo(() => {

    const materialOptions: Partial<MeshBasicMaterialParameters> = {
      color: new Color(mascaraColor),
      transparent: !!alphaMap,
      opacity: 0.77,
    };

    if (alphaMap) {
      materialOptions.alphaMap = alphaMap;
      materialOptions.alphaTest = 0;
    }

    return new MeshBasicMaterial(materialOptions);
  }, [mascaraColor, alphaMap]);

  return (
    <FaceMesh
      landmarks={landmarks}
      material={mascaraMaterial}
      planeSize={planeSize}
      flipHorizontal={isFlipped}
    />
  );
};

const Mascara: React.FC<MascaraProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <MascaraInner {...props} />
    </Suspense>
  );
};

export default Mascara;
