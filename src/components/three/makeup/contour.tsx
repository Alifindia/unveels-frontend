// Contour.tsx
import { MeshProps, useLoader } from "@react-three/fiber";
import React, { useMemo, Suspense, useEffect } from "react";
import { MeshBasicMaterial, TextureLoader } from "three";
import FaceMesh from "../face-mesh";
import { useMakeup } from "../../../context/makeup-context";
import {
  CONTOUR_TEXTURE_ONE,
  CONTOUR_TEXTURE_DUAL_ONE_HIGH,
  CONTOUR_TEXTURE_DUAL_ONE,
  CONTOUR_TEXTURE_DUAL_TWO_HIGH,
  CONTOUR_TEXTURE_DUAL_TWO,
  CONTOUR_TEXTURE_DUAL_THREE_HIGH,
  CONTOUR_TEXTURE_DUAL_THREE,
  CONTOUR_TEXTURE_DUAL_FOUR_HIGH,
  CONTOUR_TEXTURE_DUAL_FOUR,
  CONTOUR_TEXTURE_DUAL_FIVE_HIGH,
  CONTOUR_TEXTURE_DUAL_FIVE,
} from "../../../utils/constants";
import { Landmark } from "../../../types/landmark";

interface ContourProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
  isFlipped: boolean;
}

const ContourInner: React.FC<ContourProps> = ({
  landmarks,
  planeSize,
  isFlipped,
}) => {
  const { contourMode, contourColors, contourShape } = useMakeup();

  // Define mappings based on shape index (0 to 5)
  const shapeIndex = useMemo(() => parseInt(contourShape, 10), [contourShape]);

  useEffect(() => {
    console.log("Shape Index:", shapeIndex);
    console.log("Contour Colors:", contourColors);
    console.log("Contour Mode: ", contourMode);
  }, [shapeIndex, contourColors, contourMode]);

  // Define texture mappings based on shapeIndex
  const oneModeTexturePath = useMemo(() => {
    switch (shapeIndex) {
      case 0:
        return CONTOUR_TEXTURE_ONE;
      case 1:
        return CONTOUR_TEXTURE_DUAL_ONE;
      case 2:
        return CONTOUR_TEXTURE_DUAL_TWO;
      case 3:
        return CONTOUR_TEXTURE_DUAL_THREE;
      case 4:
        return CONTOUR_TEXTURE_DUAL_FOUR;
      case 5:
        return CONTOUR_TEXTURE_DUAL_FIVE;
      default:
        return CONTOUR_TEXTURE_ONE;
    }
  }, [shapeIndex]);

  const dualModeStandardTexturePath = useMemo(() => {
    switch (shapeIndex) {
      case 0:
        return CONTOUR_TEXTURE_DUAL_ONE;
      case 1:
        return CONTOUR_TEXTURE_DUAL_TWO;
      case 2:
        return CONTOUR_TEXTURE_DUAL_THREE;
      case 3:
        return CONTOUR_TEXTURE_DUAL_FOUR;
      case 4:
        return CONTOUR_TEXTURE_DUAL_FIVE;
      default:
        return CONTOUR_TEXTURE_DUAL_ONE;
    }
  }, [shapeIndex]);

  const dualModeHighTexturePath = useMemo(() => {
    switch (shapeIndex) {
      case 0:
        return CONTOUR_TEXTURE_DUAL_ONE_HIGH;
      case 1:
        return CONTOUR_TEXTURE_DUAL_TWO_HIGH;
      case 2:
        return CONTOUR_TEXTURE_DUAL_THREE_HIGH;
      case 3:
        return CONTOUR_TEXTURE_DUAL_FOUR_HIGH;
      case 4:
        return CONTOUR_TEXTURE_DUAL_FIVE_HIGH;
      default:
        return CONTOUR_TEXTURE_DUAL_ONE_HIGH;
    }
  }, [shapeIndex]);

  // **Unconditionally** load all necessary textures
  const oneModeTexture = useLoader(TextureLoader, oneModeTexturePath);
  const dualStandardTexture = useLoader(
    TextureLoader,
    dualModeStandardTexturePath,
  );
  const dualHighTexture = useLoader(TextureLoader, dualModeHighTexturePath);

  // **Unconditionally** create all materials
  const singleMaterial = useMemo(() => {
    const material = new MeshBasicMaterial({
      color: contourColors[0], // Fallback to white if no color selected
      transparent: true,
      opacity: 0.36,
      alphaMap: oneModeTexture,
      alphaTest: 0,
    });
    return material;
  }, [contourColors, oneModeTexture]);

  const dualStandardMaterial = useMemo(() => {
    const material = new MeshBasicMaterial({
      color: contourColors[0],
      transparent: true,
      opacity: 0.36,
      alphaMap: dualStandardTexture,
      alphaTest: 0,
    });
    return material;
  }, [contourColors, dualStandardTexture]);

  const dualHighMaterial = useMemo(() => {
    const material = new MeshBasicMaterial({
      color: contourColors[1],
      transparent: true,
      opacity: 0.36,
      alphaMap: dualHighTexture,
      alphaTest: 0,
    });
    return material;
  }, [contourColors, dualHighTexture]);

  // Cleanup materials to prevent memory leaks
  useEffect(() => {
    return () => {
      singleMaterial.dispose();
      dualStandardMaterial.dispose();
      dualHighMaterial.dispose();
    };
  }, [singleMaterial, dualStandardMaterial, dualHighMaterial]);

  // **Always render FaceMesh components**, but conditionally set their materials and visibility
  return (
    <>
      {contourMode === "One" && contourColors[0] && (
        <FaceMesh
          landmarks={landmarks}
          material={singleMaterial}
          planeSize={planeSize}
          flipHorizontal={isFlipped}
        />
      )}

      {contourMode === "Dual" && (
        <>
          {contourColors[0] && (
            <FaceMesh
              landmarks={landmarks}
              material={dualStandardMaterial}
              planeSize={planeSize}
              flipHorizontal={isFlipped}
            />
          )}
          {contourColors[1] && (
            <FaceMesh
              landmarks={landmarks}
              material={dualHighMaterial}
              planeSize={planeSize}
              flipHorizontal={isFlipped}
            />
          )}
        </>
      )}
    </>
  );
};

const Contour: React.FC<ContourProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <ContourInner {...props} />
    </Suspense>
  );
};

export default Contour;
