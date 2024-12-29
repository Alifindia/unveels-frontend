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
  EYELINER_FIVE,
  EYELINER_FOUR,
  EYELINER_ONE,
  EYELINER_SEVEN,
  EYELINER_SIX,
  EYELINER_THREE,
  EYELINER_TWO,
  EYELINER_EIGHT,
  EYELINER_NINE,
  EYELINER_TEN,
  EYELINER_ELEVEN,
  EYELINER_TWELVE,
  EYELINER_FOURTEEN,
  EYELINER_THIRTEEN,
  EYELINER_FIVETEEN,
  EYELINER_SIXTEEN,
  EYELINER_SEVENTEEN,
} from "../../../utils/constants";

interface EyelinerProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
  isFlipped: boolean;
}

const EyelinerInner: React.FC<EyelinerProps> = ({
  landmarks,
  planeSize,
  isFlipped,
}) => {
  const { eyelinerPattern, eyelinerColor } = useMakeup();

  const eyelinerTextures = useLoader(TextureLoader, [
    EYELINER_ONE,
    EYELINER_TWO,
    EYELINER_THREE,
    EYELINER_FOUR,
    EYELINER_FIVE,
    EYELINER_SIX,
    EYELINER_SEVEN,
    EYELINER_EIGHT,
    EYELINER_NINE,
    EYELINER_TEN,
    EYELINER_ELEVEN,
    EYELINER_TWELVE,
    EYELINER_FOURTEEN,
    EYELINER_THIRTEEN,
    EYELINER_FIVETEEN,
    EYELINER_SIXTEEN,
    EYELINER_SEVENTEEN,
  ]);

  const alphaMap = eyelinerTextures[eyelinerPattern] || null;

  const eyelinerMaterial = useMemo(() => {
    console.log(eyelinerPattern);

    const materialOptions: Partial<MeshBasicMaterialParameters> = {
      color: new Color(eyelinerColor),
      transparent: !!alphaMap,
      opacity: 2,
    };

    if (alphaMap) {
      materialOptions.alphaMap = alphaMap;
      materialOptions.alphaTest = 0;
    }

    return new MeshBasicMaterial(materialOptions);
  }, [eyelinerColor, alphaMap]);

  return (
    <FaceMesh
      landmarks={landmarks}
      material={eyelinerMaterial}
      planeSize={planeSize}
      flipHorizontal={isFlipped}
    />
  );
};

const Eyeliner: React.FC<EyelinerProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <EyelinerInner {...props} />
    </Suspense>
  );
};

export default Eyeliner;
