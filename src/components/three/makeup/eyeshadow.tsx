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
  EYESHADOW_TEXTURE_ONE_ONE,
  EYESHADOW_TEXTURE_ONE_TWO,
  EYESHADOW_TEXTURE_ONE_THREE,
  EYESHADOW_TEXTURE_ONE_FOUR,
  EYESHADOW_TEXTURE_DUAL_P_ONE_ONE,
  EYESHADOW_TEXTURE_DUAL_P_ONE_TWO,
  EYESHADOW_TEXTURE_DUAL_P_TWO_ONE,
  EYESHADOW_TEXTURE_DUAL_P_TWO_TWO,
  EYESHADOW_TEXTURE_DUAL_P_THREE_ONE,
  EYESHADOW_TEXTURE_DUAL_P_THREE_TWO,
  EYESHADOW_TEXTURE_DUAL_P_FOUR_ONE,
  EYESHADOW_TEXTURE_DUAL_P_FOUR_TWO,
  EYESHADOW_TEXTURE_TRI_P_ONE_ONE,
  EYESHADOW_TEXTURE_TRI_P_ONE_TWO,
  EYESHADOW_TEXTURE_TRI_P_ONE_THREE,
  EYESHADOW_TEXTURE_TRI_P_TWO_ONE,
  EYESHADOW_TEXTURE_TRI_P_TWO_TWO,
  EYESHADOW_TEXTURE_TRI_P_TWO_THREE,
  EYESHADOW_TEXTURE_TRI_P_THREE_ONE,
  EYESHADOW_TEXTURE_TRI_P_THREE_TWO,
  EYESHADOW_TEXTURE_TRI_P_THREE_THREE,
  EYESHADOW_TEXTURE_TRI_P_FOUR_ONE,
  EYESHADOW_TEXTURE_TRI_P_FOUR_TWO,
  EYESHADOW_TEXTURE_TRI_P_FOUR_THREE,
  EYESHADOW_TEXTURE_QUAD_P_ONE_ONE,
  EYESHADOW_TEXTURE_QUAD_P_ONE_TWO,
  EYESHADOW_TEXTURE_QUAD_P_ONE_THREE,
  EYESHADOW_TEXTURE_QUAD_P_ONE_FOUR,
  EYESHADOW_TEXTURE_QUAD_P_TWO_ONE,
  EYESHADOW_TEXTURE_QUAD_P_TWO_TWO,
  EYESHADOW_TEXTURE_QUAD_P_TWO_THREE,
  EYESHADOW_TEXTURE_QUAD_P_TWO_FOUR,
  EYESHADOW_TEXTURE_QUAD_P_THREE_ONE,
  EYESHADOW_TEXTURE_QUAD_P_THREE_TWO,
  EYESHADOW_TEXTURE_QUAD_P_THREE_THREE,
  EYESHADOW_TEXTURE_QUAD_P_THREE_FOUR,
  EYESHADOW_TEXTURE_QUAD_P_FOUR_ONE,
  EYESHADOW_TEXTURE_QUAD_P_FOUR_TWO,
  EYESHADOW_TEXTURE_QUAD_P_FOUR_THREE,
  EYESHADOW_TEXTURE_QUAD_P_FOUR_FOUR,
  EYESHADOW_TEXTURE_PENTA_P_ONE_ONE,
  EYESHADOW_TEXTURE_PENTA_P_ONE_TWO,
  EYESHADOW_TEXTURE_PENTA_P_ONE_THREE,
  EYESHADOW_TEXTURE_PENTA_P_ONE_FOUR,
  EYESHADOW_TEXTURE_PENTA_P_ONE_FIVE,
  EYESHADOW_TEXTURE_PENTA_P_TWO_ONE,
  EYESHADOW_TEXTURE_PENTA_P_TWO_TWO,
  EYESHADOW_TEXTURE_PENTA_P_TWO_THREE,
  EYESHADOW_TEXTURE_PENTA_P_TWO_FOUR,
  EYESHADOW_TEXTURE_PENTA_P_TWO_FIVE,
  EYESHADOW_TEXTURE_PENTA_P_THREE_ONE,
  EYESHADOW_TEXTURE_PENTA_P_THREE_TWO,
  EYESHADOW_TEXTURE_PENTA_P_THREE_THREE,
  EYESHADOW_TEXTURE_PENTA_P_THREE_FOUR,
  EYESHADOW_TEXTURE_PENTA_P_THREE_FIVE,
} from "../../../utils/constants";

interface EyeShadowProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
  isFlipped: boolean;
}

const EyeShadowInner: React.FC<EyeShadowProps> = ({
  landmarks,
  planeSize,
  isFlipped,
}) => {
  const { eyeshadowMode, eyeshadowColor, eyeshadowPattern } = useMakeup();

  const shapeIndex = useMemo(() => eyeshadowPattern, [eyeshadowPattern]);

  useEffect(() => {
    console.log("Shape Index:", shapeIndex);
    console.log("eyeshadow Colors:", eyeshadowColor);
    console.log("eyeshadow MoeyeshadowModede: ", eyeshadowMode);
  }, [shapeIndex, eyeshadowColor, eyeshadowMode]);

  // Define texture mappings based on shapeIndex
  const oneModeTexturePath = useMemo(() => {
    switch (shapeIndex) {
      case 0:
        return EYESHADOW_TEXTURE_ONE_ONE;
      case 1:
        return EYESHADOW_TEXTURE_ONE_TWO;
      case 2:
        return EYESHADOW_TEXTURE_ONE_THREE;
      case 3:
        return EYESHADOW_TEXTURE_ONE_FOUR;
      default:
        return EYESHADOW_TEXTURE_ONE_ONE;
    }
  }, [shapeIndex]);

  const dualModeStandardTexturePath = useMemo(() => {
    switch (shapeIndex) {
      case 0:
        return EYESHADOW_TEXTURE_DUAL_P_ONE_ONE;
      case 1:
        return EYESHADOW_TEXTURE_DUAL_P_TWO_ONE;
      case 2:
        return EYESHADOW_TEXTURE_DUAL_P_THREE_ONE;
      case 3:
        return EYESHADOW_TEXTURE_DUAL_P_FOUR_ONE;
      default:
        return EYESHADOW_TEXTURE_DUAL_P_ONE_ONE;
    }
  }, [shapeIndex]);

  const dualModeHighTexturePath = useMemo(() => {
    switch (shapeIndex) {
      case 0:
        return EYESHADOW_TEXTURE_DUAL_P_ONE_TWO;
      case 1:
        return EYESHADOW_TEXTURE_DUAL_P_TWO_TWO;
      case 2:
        return EYESHADOW_TEXTURE_DUAL_P_THREE_TWO;
      case 3:
        return EYESHADOW_TEXTURE_DUAL_P_FOUR_TWO;
      default:
        return EYESHADOW_TEXTURE_DUAL_P_ONE_TWO;
    }
  }, [shapeIndex]);

  const triModeStandardTexturePath = useMemo(() => {
    switch (shapeIndex) {
      case 0:
        return EYESHADOW_TEXTURE_TRI_P_ONE_ONE;
      case 1:
        return EYESHADOW_TEXTURE_TRI_P_TWO_ONE;
      case 2:
        return EYESHADOW_TEXTURE_TRI_P_THREE_ONE;
      case 3:
        return EYESHADOW_TEXTURE_TRI_P_FOUR_ONE;
      default:
        return EYESHADOW_TEXTURE_TRI_P_ONE_ONE;
    }
  }, [shapeIndex]);

  const triModeHighTexturePath = useMemo(() => {
    switch (shapeIndex) {
      case 0:
        return EYESHADOW_TEXTURE_TRI_P_ONE_TWO;
      case 1:
        return EYESHADOW_TEXTURE_TRI_P_TWO_TWO;
      case 2:
        return EYESHADOW_TEXTURE_TRI_P_THREE_TWO;
      case 3:
        return EYESHADOW_TEXTURE_TRI_P_FOUR_TWO;
      default:
        return EYESHADOW_TEXTURE_TRI_P_ONE_TWO;
    }
  }, [shapeIndex]);

  const triModeMidTexturePath = useMemo(() => {
    switch (shapeIndex) {
      case 0:
        return EYESHADOW_TEXTURE_TRI_P_ONE_THREE;
      case 1:
        return EYESHADOW_TEXTURE_TRI_P_TWO_THREE;
      case 2:
        return EYESHADOW_TEXTURE_TRI_P_THREE_THREE;
      case 3:
        return EYESHADOW_TEXTURE_TRI_P_FOUR_THREE;
      default:
        return EYESHADOW_TEXTURE_TRI_P_ONE_THREE;
    }
  }, [shapeIndex]);

  const quadModeStandardTexturePath = useMemo(() => {
    switch (shapeIndex) {
      case 0:
        return EYESHADOW_TEXTURE_QUAD_P_ONE_ONE;
      case 1:
        return EYESHADOW_TEXTURE_QUAD_P_TWO_ONE;
      case 2:
        return EYESHADOW_TEXTURE_QUAD_P_THREE_ONE;
      case 3:
        return EYESHADOW_TEXTURE_QUAD_P_FOUR_ONE;
      default:
        return EYESHADOW_TEXTURE_QUAD_P_ONE_ONE;
    }
  }, [shapeIndex]);

  const quadModeHighTexturePath = useMemo(() => {
    switch (shapeIndex) {
      case 0:
        return EYESHADOW_TEXTURE_QUAD_P_ONE_TWO;
      case 1:
        return EYESHADOW_TEXTURE_QUAD_P_TWO_TWO;
      case 2:
        return EYESHADOW_TEXTURE_QUAD_P_THREE_TWO;
      case 3:
        return EYESHADOW_TEXTURE_QUAD_P_FOUR_TWO;
      default:
        return EYESHADOW_TEXTURE_QUAD_P_ONE_TWO;
    }
  }, [shapeIndex]);

  const quadModeMidTexturePath = useMemo(() => {
    switch (shapeIndex) {
      case 0:
        return EYESHADOW_TEXTURE_QUAD_P_ONE_THREE;
      case 1:
        return EYESHADOW_TEXTURE_QUAD_P_TWO_THREE;
      case 2:
        return EYESHADOW_TEXTURE_QUAD_P_THREE_THREE;
      case 3:
        return EYESHADOW_TEXTURE_QUAD_P_FOUR_THREE;
      default:
        return EYESHADOW_TEXTURE_QUAD_P_ONE_THREE;
    }
  }, [shapeIndex]);

  const quadModeLowerTexturePath = useMemo(() => {
    switch (shapeIndex) {
      case 0:
        return EYESHADOW_TEXTURE_QUAD_P_ONE_FOUR;
      case 1:
        return EYESHADOW_TEXTURE_QUAD_P_TWO_FOUR;
      case 2:
        return EYESHADOW_TEXTURE_QUAD_P_THREE_FOUR;
      case 3:
        return EYESHADOW_TEXTURE_QUAD_P_FOUR_FOUR;
      default:
        return EYESHADOW_TEXTURE_QUAD_P_ONE_FOUR;
    }
  }, [shapeIndex]);

  const pentaModeStandardTexturePath = useMemo(() => {
    switch (shapeIndex) {
      case 0:
        return EYESHADOW_TEXTURE_PENTA_P_ONE_ONE;
      case 1:
        return EYESHADOW_TEXTURE_PENTA_P_TWO_ONE;
      case 2:
        return EYESHADOW_TEXTURE_PENTA_P_THREE_ONE;
      default:
        return EYESHADOW_TEXTURE_PENTA_P_ONE_ONE;
    }
  }, [shapeIndex]);

  const pentaModeHighTexturePath = useMemo(() => {
    switch (shapeIndex) {
      case 0:
        return EYESHADOW_TEXTURE_PENTA_P_ONE_TWO;
      case 1:
        return EYESHADOW_TEXTURE_PENTA_P_TWO_TWO;
      case 2:
        return EYESHADOW_TEXTURE_PENTA_P_THREE_TWO;
      default:
        return EYESHADOW_TEXTURE_PENTA_P_ONE_TWO;
    }
  }, [shapeIndex]);

  const pentaModeMidTexturePath = useMemo(() => {
    switch (shapeIndex) {
      case 0:
        return EYESHADOW_TEXTURE_PENTA_P_ONE_THREE;
      case 1:
        return EYESHADOW_TEXTURE_PENTA_P_TWO_THREE;
      case 2:
        return EYESHADOW_TEXTURE_PENTA_P_THREE_THREE;
      default:
        return EYESHADOW_TEXTURE_PENTA_P_ONE_THREE;
    }
  }, [shapeIndex]);

  const pentaModeLowerTexturePath = useMemo(() => {
    switch (shapeIndex) {
      case 0:
        return EYESHADOW_TEXTURE_PENTA_P_ONE_FOUR;
      case 1:
        return EYESHADOW_TEXTURE_PENTA_P_TWO_FOUR;
      case 2:
        return EYESHADOW_TEXTURE_PENTA_P_THREE_FOUR;
      default:
        return EYESHADOW_TEXTURE_PENTA_P_ONE_FOUR;
    }
  }, [shapeIndex]);

  const pentaModeSideTexturePath = useMemo(() => {
    switch (shapeIndex) {
      case 0:
        return EYESHADOW_TEXTURE_PENTA_P_ONE_FIVE;
      case 1:
        return EYESHADOW_TEXTURE_PENTA_P_TWO_FIVE;
      case 2:
        return EYESHADOW_TEXTURE_PENTA_P_THREE_FOUR;
      default:
        return EYESHADOW_TEXTURE_PENTA_P_THREE_FIVE;
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
  const quadStandardTexture = useLoader(
    TextureLoader,
    quadModeStandardTexturePath,
  );
  const quadHighTexture = useLoader(TextureLoader, quadModeHighTexturePath);
  const quadMidTexture = useLoader(TextureLoader, quadModeMidTexturePath);
  const quadLowerTexture = useLoader(TextureLoader, quadModeLowerTexturePath);
  const pentaStandardTexture = useLoader(
    TextureLoader,
    pentaModeStandardTexturePath,
  );
  const pentaHighTexture = useLoader(TextureLoader, pentaModeHighTexturePath);
  const pentaMidTexture = useLoader(TextureLoader, pentaModeMidTexturePath);
  const pentaLowerTexture = useLoader(TextureLoader, pentaModeLowerTexturePath);
  const pentaSideTexture = useLoader(TextureLoader, pentaModeSideTexturePath);

  // **Unconditionally** create all materials
  const singleMaterial = useMemo(() => {
    const material = new MeshBasicMaterial({
      color: eyeshadowColor[0], // Fallback to white if no color selected
      transparent: true,
      opacity: 0.4,
      alphaMap: oneModeTexture,
      alphaTest: 0,
    });
    return material;
  }, [eyeshadowColor, oneModeTexture]);

  const dualStandardMaterial = useMemo(() => {
    const material = new MeshBasicMaterial({
      color: eyeshadowColor[0],
      transparent: true,
      opacity: 0.4,
      alphaMap: dualStandardTexture,
      alphaTest: 0,
    });
    return material;
  }, [eyeshadowColor, dualStandardTexture]);

  const dualHighMaterial = useMemo(() => {
    const material = new MeshBasicMaterial({
      color: eyeshadowColor[1],
      transparent: true,
      opacity: 0.4,
      alphaMap: dualHighTexture,
      alphaTest: 0,
    });
    return material;
  }, [eyeshadowColor, dualHighTexture]);

  const triStandardMaterial = useMemo(() => {
    const material = new MeshBasicMaterial({
      color: eyeshadowColor[0],
      transparent: true,
      opacity: 0.4,
      alphaMap: triStandardTexture,
      alphaTest: 0,
    });
    return material;
  }, [eyeshadowColor, triStandardTexture]);

  const triHighMaterial = useMemo(() => {
    const material = new MeshBasicMaterial({
      color: eyeshadowColor[1],
      transparent: true,
      opacity: 0.4,
      alphaMap: triHighTexture,
      alphaTest: 0,
    });
    return material;
  }, [eyeshadowColor, triHighTexture]);

  const triMidMaterial = useMemo(() => {
    const material = new MeshBasicMaterial({
      color: eyeshadowColor[2],
      transparent: true,
      opacity: 0.4,
      alphaMap: triMidTexture,
      alphaTest: 0,
    });
    return material;
  }, [eyeshadowColor, triMidTexture]);

  const quadStandardMaterial = useMemo(() => {
    const material = new MeshBasicMaterial({
      color: eyeshadowColor[0],
      transparent: true,
      opacity: 0.4,
      alphaMap: quadStandardTexture,
      alphaTest: 0,
    });
    return material;
  }, [eyeshadowColor, quadStandardTexture]);

  const quadHighMaterial = useMemo(() => {
    const material = new MeshBasicMaterial({
      color: eyeshadowColor[1],
      transparent: true,
      opacity: 0.4,
      alphaMap: quadHighTexture,
      alphaTest: 0,
    });
    return material;
  }, [eyeshadowColor, quadHighTexture]);

  const quadMidMaterial = useMemo(() => {
    const material = new MeshBasicMaterial({
      color: eyeshadowColor[2],
      transparent: true,
      opacity: 0.4,
      alphaMap: quadMidTexture,
      alphaTest: 0,
    });
    return material;
  }, [eyeshadowColor, quadMidTexture]);

  const quadLowerMaterial = useMemo(() => {
    const material = new MeshBasicMaterial({
      color: eyeshadowColor[3],
      transparent: true,
      opacity: 0.4,
      alphaMap: quadLowerTexture,
      alphaTest: 0,
    });
    return material;
  }, [eyeshadowColor, quadLowerTexture]);

  const pentaStandardMaterial = useMemo(() => {
    const material = new MeshBasicMaterial({
      color: eyeshadowColor[0],
      transparent: true,
      opacity: 0.4,
      alphaMap: pentaStandardTexture,
      alphaTest: 0,
    });
    return material;
  }, [eyeshadowColor, pentaStandardTexture]);

  const pentaHighMaterial = useMemo(() => {
    const material = new MeshBasicMaterial({
      color: eyeshadowColor[1],
      transparent: true,
      opacity: 0.4,
      alphaMap: pentaHighTexture,
      alphaTest: 0,
    });
    return material;
  }, [eyeshadowColor, pentaHighTexture]);

  const pentaMidMaterial = useMemo(() => {
    const material = new MeshBasicMaterial({
      color: eyeshadowColor[2],
      transparent: true,
      opacity: 0.4,
      alphaMap: pentaMidTexture,
      alphaTest: 0,
    });
    return material;
  }, [eyeshadowColor, pentaMidTexture]);

  const pentaLowerMaterial = useMemo(() => {
    const material = new MeshBasicMaterial({
      color: eyeshadowColor[3],
      transparent: true,
      opacity: 0.4,
      alphaMap: pentaLowerTexture,
      alphaTest: 0,
    });
    return material;
  }, [eyeshadowColor, pentaLowerTexture]);

  const pentaSideMaterial = useMemo(() => {
    const material = new MeshBasicMaterial({
      color: eyeshadowColor[4],
      transparent: true,
      opacity: 0.4,
      alphaMap: pentaSideTexture,
      alphaTest: 0,
    });
    return material;
  }, [eyeshadowColor, pentaSideTexture]);

  // Cleanup materials to prevent memory leaks
  useEffect(() => {
    return () => {
      singleMaterial.dispose();
      dualStandardMaterial.dispose();
      dualHighMaterial.dispose();
      triStandardMaterial.dispose();
      triHighMaterial.dispose();
      triMidMaterial.dispose();
      quadStandardMaterial.dispose();
      quadHighMaterial.dispose();
      quadMidMaterial.dispose();
      quadLowerMaterial.dispose();
      pentaStandardMaterial.dispose();
      pentaHighMaterial.dispose();
      pentaMidMaterial.dispose();
      pentaLowerMaterial.dispose();
      pentaSideMaterial.dispose();
    };
  }, [
    singleMaterial,
    dualStandardMaterial,
    dualHighMaterial,
    triStandardMaterial,
    triHighMaterial,
    triMidMaterial,
    quadStandardMaterial,
    quadHighMaterial,
    quadMidMaterial,
    quadLowerMaterial,
    pentaStandardMaterial,
    pentaHighMaterial,
    pentaMidMaterial,
    pentaLowerMaterial,
    pentaSideMaterial,
  ]);

  return (
    <>
      {eyeshadowMode === "One" && eyeshadowColor[0] && (
        <FaceMesh
          landmarks={landmarks}
          material={singleMaterial}
          planeSize={planeSize}
          flipHorizontal={isFlipped}
        />
      )}

      {eyeshadowMode === "Dual" && (
        <>
          {eyeshadowColor[0] && (
            <FaceMesh
              landmarks={landmarks}
              material={dualStandardMaterial}
              planeSize={planeSize}
              flipHorizontal={isFlipped}
            />
          )}
          {eyeshadowColor[1] && (
            <FaceMesh
              landmarks={landmarks}
              material={dualHighMaterial}
              planeSize={planeSize}
              flipHorizontal={isFlipped}
            />
          )}
        </>
      )}

      {eyeshadowMode === "Tri" && (
        <>
          {eyeshadowColor[0] && (
            <FaceMesh
              landmarks={landmarks}
              material={triStandardMaterial}
              planeSize={planeSize}
              flipHorizontal={isFlipped}
            />
          )}
          {eyeshadowColor[1] && (
            <FaceMesh
              landmarks={landmarks}
              material={triHighMaterial}
              planeSize={planeSize}
              flipHorizontal={isFlipped}
            />
          )}
          {eyeshadowColor[2] && (
            <FaceMesh
              landmarks={landmarks}
              material={triMidMaterial}
              planeSize={planeSize}
              flipHorizontal={isFlipped}
            />
          )}
        </>
      )}

      {eyeshadowMode === "Quad" && (
        <>
          {eyeshadowColor[0] && (
            <FaceMesh
              landmarks={landmarks}
              material={quadStandardMaterial}
              planeSize={planeSize}
              flipHorizontal={isFlipped}
            />
          )}
          {eyeshadowColor[1] && (
            <FaceMesh
              landmarks={landmarks}
              material={quadHighMaterial}
              planeSize={planeSize}
              flipHorizontal={isFlipped}
            />
          )}
          {eyeshadowColor[2] && (
            <FaceMesh
              landmarks={landmarks}
              material={quadMidMaterial}
              planeSize={planeSize}
              flipHorizontal={isFlipped}
            />
          )}
          {eyeshadowColor[3] && (
            <FaceMesh
              landmarks={landmarks}
              material={quadLowerMaterial}
              planeSize={planeSize}
              flipHorizontal={isFlipped}
            />
          )}
        </>
      )}

      {eyeshadowMode === "Penta" && (
        <>
          {eyeshadowColor[0] && (
            <FaceMesh
              landmarks={landmarks}
              material={pentaStandardMaterial}
              planeSize={planeSize}
              flipHorizontal={isFlipped}
            />
          )}
          {eyeshadowColor[1] && (
            <FaceMesh
              landmarks={landmarks}
              material={pentaHighMaterial}
              planeSize={planeSize}
              flipHorizontal={isFlipped}
            />
          )}
          {eyeshadowColor[2] && (
            <FaceMesh
              landmarks={landmarks}
              material={pentaMidMaterial}
              planeSize={planeSize}
              flipHorizontal={isFlipped}
            />
          )}
          {eyeshadowColor[3] && (
            <FaceMesh
              landmarks={landmarks}
              material={pentaLowerMaterial}
              planeSize={planeSize}
              flipHorizontal={isFlipped}
            />
          )}
          {eyeshadowColor[4] && (
            <FaceMesh
              landmarks={landmarks}
              material={pentaSideMaterial}
              planeSize={planeSize}
              flipHorizontal={isFlipped}
            />
          )}
        </>
      )}
    </>
  );
};

const EyeShadow: React.FC<EyeShadowProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <EyeShadowInner {...props} />
    </Suspense>
  );
};

export default EyeShadow;
