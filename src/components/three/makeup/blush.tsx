import { MeshProps, useLoader } from "@react-three/fiber";
import React, { useMemo, Suspense, useEffect } from "react";
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
  BLUSH_TEXTURE_ONE_ONE,
  BLUSH_TEXTURE_ONE_TWO,
  BLUSH_TEXTURE_ONE_THREE,
  BLUSH_TEXTURE_ONE_FOUR,
  BLUSH_TEXTURE_ONE_FIVE,
  BLUSH_TEXTURE_DUAL_P_ONE_ONE,
  BLUSH_TEXTURE_DUAL_P_ONE_TWO,
  BLUSH_TEXTURE_DUAL_P_DUAL_ONE,
  BLUSH_TEXTURE_DUAL_P_DUAL_TWO,
  BLUSH_TEXTURE_DUAL_P_THREE_ONE,
  BLUSH_TEXTURE_DUAL_P_THREE_TWO,
  BLUSH_TEXTURE_DUAL_P_FOUR_ONE,
  BLUSH_TEXTURE_DUAL_P_FOUR_TWO,
  BLUSH_TEXTURE_DUAL_P_FIVE_ONE,
  BLUSH_TEXTURE_DUAL_P_FIVE_TWO,
  BLUSH_TEXTURE_DUAL_P_SIX_ONE,
  BLUSH_TEXTURE_DUAL_P_SIX_TWO,
  BLUSH_TEXTURE_TRI_P_ONE_ONE,
  BLUSH_TEXTURE_TRI_P_ONE_TWO,
  BLUSH_TEXTURE_TRI_P_ONE_THREE,
  BLUSH_TEXTURE_TRI_P_DUAL_ONE,
  BLUSH_TEXTURE_TRI_P_DUAL_TWO,
  BLUSH_TEXTURE_TRI_P_DUAL_THREE,
  BLUSH_TEXTURE_TRI_P_THREE_ONE,
  BLUSH_TEXTURE_TRI_P_THREE_TWO,
  BLUSH_TEXTURE_TRI_P_THREE_THREE,
  BLUSH_TEXTURE_TRI_P_FOUR_ONE,
  BLUSH_TEXTURE_TRI_P_FOUR_TWO,
  BLUSH_TEXTURE_TRI_P_FOUR_THREE,
  BLUSH_TEXTURE_TRI_P_FIVE_ONE,
  BLUSH_TEXTURE_TRI_P_FIVE_TWO,
  BLUSH_TEXTURE_TRI_P_FIVE_THREE,
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
  const { blushMode, blushColor, blushPattern } = useMakeup();
  // Define mappings based on shape index (0 to 5)
  const shapeIndex = useMemo(() => blushPattern, [blushPattern]);

  useEffect(() => {
    console.log("Shape Index:", shapeIndex);
    console.log("blush Colors:", blushColor);
    console.log("blush Mode: ", blushMode);
  }, [shapeIndex, blushColor, blushMode]);

  // Define texture mappings based on shapeIndex
  const oneModeTexturePath = useMemo(() => {
    switch (shapeIndex) {
      case 0:
        return BLUSH_TEXTURE_ONE_ONE;
      case 1:
        return BLUSH_TEXTURE_ONE_TWO;
      case 2:
        return BLUSH_TEXTURE_ONE_THREE;
      case 3:
        return BLUSH_TEXTURE_ONE_FOUR;
      case 4:
        return BLUSH_TEXTURE_ONE_FIVE;
      default:
        return BLUSH_TEXTURE_ONE_ONE;
    }
  }, [shapeIndex]);

  const dualModeStandardTexturePath = useMemo(() => {
    switch (shapeIndex) {
      case 0:
        return BLUSH_TEXTURE_DUAL_P_ONE_ONE;
      case 1:
        return BLUSH_TEXTURE_DUAL_P_DUAL_ONE;
      case 2:
        return BLUSH_TEXTURE_DUAL_P_THREE_ONE;
      case 3:
        return BLUSH_TEXTURE_DUAL_P_FOUR_ONE;
      case 4:
        return BLUSH_TEXTURE_DUAL_P_FIVE_ONE;
      case 5:
        return BLUSH_TEXTURE_DUAL_P_SIX_ONE;
      default:
        return BLUSH_TEXTURE_DUAL_P_ONE_ONE;
    }
  }, [shapeIndex]);

  const dualModeHighTexturePath = useMemo(() => {
    switch (shapeIndex) {
      case 0:
        return BLUSH_TEXTURE_DUAL_P_ONE_TWO;
      case 1:
        return BLUSH_TEXTURE_DUAL_P_DUAL_TWO;
      case 2:
        return BLUSH_TEXTURE_DUAL_P_THREE_TWO;
      case 3:
        return BLUSH_TEXTURE_DUAL_P_FOUR_TWO;
      case 4:
        return BLUSH_TEXTURE_DUAL_P_FIVE_TWO;
      case 5:
        return BLUSH_TEXTURE_DUAL_P_SIX_TWO;
      default:
        return BLUSH_TEXTURE_DUAL_P_ONE_TWO;
    }
  }, [shapeIndex]);

  const triModeStandardTexturePath = useMemo(() => {
    switch (shapeIndex) {
      case 0:
        return BLUSH_TEXTURE_TRI_P_ONE_ONE;
      case 1:
        return BLUSH_TEXTURE_TRI_P_DUAL_ONE;
      case 2:
        return BLUSH_TEXTURE_TRI_P_THREE_ONE;
      case 3:
        return BLUSH_TEXTURE_TRI_P_FOUR_ONE;
      case 4:
        return BLUSH_TEXTURE_TRI_P_FIVE_ONE;
      default:
        return BLUSH_TEXTURE_ONE_ONE;
    }
  }, [shapeIndex]);

  const triModeHighTexturePath = useMemo(() => {
    switch (shapeIndex) {
      case 0:
        return BLUSH_TEXTURE_TRI_P_ONE_TWO;
      case 1:
        return BLUSH_TEXTURE_TRI_P_DUAL_TWO;
      case 2:
        return BLUSH_TEXTURE_TRI_P_THREE_TWO;
      case 3:
        return BLUSH_TEXTURE_TRI_P_FOUR_TWO;
      case 4:
        return BLUSH_TEXTURE_TRI_P_FIVE_TWO;
      default:
        return BLUSH_TEXTURE_TRI_P_ONE_TWO;
    }
  }, [shapeIndex]);

  const triModeMidTexturePath = useMemo(() => {
    switch (shapeIndex) {
      case 0:
        return BLUSH_TEXTURE_TRI_P_ONE_THREE;
      case 1:
        return BLUSH_TEXTURE_TRI_P_DUAL_THREE;
      case 2:
        return BLUSH_TEXTURE_TRI_P_THREE_THREE;
      case 3:
        return BLUSH_TEXTURE_TRI_P_FOUR_THREE;
      case 4:
        return BLUSH_TEXTURE_TRI_P_FIVE_THREE;
      default:
        return BLUSH_TEXTURE_TRI_P_ONE_THREE;
    }
  }, [shapeIndex]);

  // **Unconditionally** load all necessary textures
  const oneModeTexture = useLoader(TextureLoader, oneModeTexturePath);
  const dualStandardTexture = useLoader(
    TextureLoader,
    dualModeStandardTexturePath,
  );
  const dualHighTexture = useLoader(TextureLoader, dualModeHighTexturePath);
  const triStandardTexture = useLoader(
    TextureLoader,
    triModeStandardTexturePath,
  );
  const triHighTexture = useLoader(TextureLoader, triModeHighTexturePath);
  const triMidTexture = useLoader(TextureLoader, triModeMidTexturePath);

  const singleMaterial = useMemo(() => {
    const material = new MeshBasicMaterial({
      color: blushColor[0],
      transparent: true,
      opacity: 0.36,
      alphaMap: oneModeTexture,
      alphaTest: 0,
    });
    return material;
  }, [blushColor, oneModeTexture]);

  const dualStandardMaterial = useMemo(() => {
    const material = new MeshBasicMaterial({
      color: blushColor[0],
      transparent: true,
      opacity: 0.36,
      alphaMap: dualStandardTexture,
      alphaTest: 0,
    });
    return material;
  }, [blushColor, dualStandardTexture]);

  const dualHighMaterial = useMemo(() => {
    const material = new MeshBasicMaterial({
      color: blushColor[1],
      transparent: true,
      opacity: 0.36,
      alphaMap: dualHighTexture,
      alphaTest: 0,
    });
    return material;
  }, [blushColor, dualHighTexture]);

  const triStandardMaterial = useMemo(() => {
    const material = new MeshBasicMaterial({
      color: blushColor[0],
      transparent: true,
      opacity: 2,
      alphaMap: triStandardTexture,
      alphaTest: 0,
    });
    return material;
  }, [blushColor, triStandardTexture]);

  const triHighMaterial = useMemo(() => {
    const material = new MeshBasicMaterial({
      color: blushColor[1],
      transparent: true,
      opacity: 0.36,
      alphaMap: triHighTexture,
      alphaTest: 0,
    });
    return material;
  }, [blushColor, triHighTexture]);

  const triMidMaterial = useMemo(() => {
    const material = new MeshBasicMaterial({
      color: blushColor[2],
      transparent: true,
      opacity: 0.36,
      alphaMap: triMidTexture,
      alphaTest: 0,
    });
    return material;
  }, [blushColor, triMidTexture]);
  // Cleanup materials to prevent memory leaks
  useEffect(() => {
    return () => {
      singleMaterial.dispose();
      dualStandardMaterial.dispose();
      dualHighMaterial.dispose();
      triStandardMaterial.dispose();
      triHighMaterial.dispose();
      triMidMaterial.dispose();
    };
  }, [
    singleMaterial,
    dualStandardMaterial,
    dualHighMaterial,
    triStandardMaterial,
    triHighMaterial,
    triMidMaterial,
  ]);
  return (
    <>
      <>
        {blushMode === "One" && blushColor[0] && (
          <FaceMesh
            landmarks={landmarks}
            material={singleMaterial}
            planeSize={planeSize}
            flipHorizontal={isFlipped}
          />
        )}

        {blushMode === "Dual" && (
          <>
            {blushColor[0] && (
              <FaceMesh
                landmarks={landmarks}
                material={dualStandardMaterial}
                planeSize={planeSize}
                flipHorizontal={isFlipped}
              />
            )}
            {blushColor[1] && (
              <FaceMesh
                landmarks={landmarks}
                material={dualHighMaterial}
                planeSize={planeSize}
                flipHorizontal={isFlipped}
              />
            )}
          </>
        )}

        {blushMode === "Tri" && (
          <>
            {blushColor[0] && (
              <FaceMesh
                landmarks={landmarks}
                material={triStandardMaterial}
                planeSize={planeSize}
                flipHorizontal={isFlipped}
              />
            )}
            {blushColor[1] && (
              <FaceMesh
                landmarks={landmarks}
                material={triHighMaterial}
                planeSize={planeSize}
                flipHorizontal={isFlipped}
              />
            )}
            {blushColor[2] && (
              <FaceMesh
                landmarks={landmarks}
                material={triMidMaterial}
                planeSize={planeSize}
                flipHorizontal={isFlipped}
              />
            )}
          </>
        )}
      </>
    </>
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
