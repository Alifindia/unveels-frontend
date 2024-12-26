// LipColor.tsx
import { MeshProps, useLoader } from "@react-three/fiber";
import React, { useMemo, Suspense, useEffect } from "react";
import { MeshBasicMaterial, TextureLoader } from "three";
import FaceMesh from "../face-mesh";
import { useMakeup } from "../../../context/makeup-context";
import {
  LIPS_TEXTURE_ONE,
  LIPS_TEXTURE_DUAL_UP,
  LIPS_TEXTURE_DUAL_DOWN,
  LIPS_TEXTURE_OMBRE_BASE,
  LIPS_TEXTURE_OMBRE_INNER,
} from "../../../utils/constants";
import { Landmark } from "../../../types/landmark";

interface LipColorProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
  isFlipped: boolean;
}

const LipColorInner: React.FC<LipColorProps> = ({
  landmarks,
  planeSize,
  isFlipped,
}) => {
  const { lipColorMode, lipColors } = useMakeup();

  useEffect(() => {
    console.log("Lip Color Mode:", lipColorMode);
    console.log("Lip Colors:", lipColors);
  }, [lipColorMode, lipColors]);

  // Definisikan peta tekstur berdasarkan mode
  const texturePaths = useMemo(() => {
    if (lipColorMode === "One") {
      return {
        standard: LIPS_TEXTURE_ONE,
      };
    } else if (lipColorMode === "Dual") {
      return {
        standard: LIPS_TEXTURE_DUAL_UP,
        high: LIPS_TEXTURE_DUAL_DOWN,
      };
    } else if (lipColorMode === "Ombre") {
      return {
        standard: LIPS_TEXTURE_OMBRE_BASE,
        high: LIPS_TEXTURE_OMBRE_INNER,
      };
    }
    return {};
  }, [lipColorMode]);

  // Muat semua tekstur yang diperlukan
  const standardTexture = useLoader(
    TextureLoader,
    texturePaths.standard || LIPS_TEXTURE_ONE,
  );
  const highTexture = useLoader(
    TextureLoader,
    texturePaths.high ||
      (lipColorMode === "Dual"
        ? LIPS_TEXTURE_DUAL_DOWN
        : LIPS_TEXTURE_OMBRE_INNER),
  );

  // Buat material berdasarkan mode dan warna yang dipilih
  const singleMaterial = useMemo(() => {
    const color = lipColors[0] || "#FFFFFF"; // Fallback ke putih jika tidak ada warna
    const material = new MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 1,
      alphaMap: standardTexture,
      alphaTest: 0,
    });
    return material;
  }, [lipColors, standardTexture]);

  const dualStandardMaterial = useMemo(() => {
    const color = lipColors[0] || "#FFFFFF";
    const material = new MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 1,
      alphaMap: standardTexture,
      alphaTest: 0,
    });
    return material;
  }, [lipColors, standardTexture]);

  const dualHighMaterial = useMemo(() => {
    const color = lipColors[1] || "#FFFFFF";
    const material = new MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 1,
      alphaMap: highTexture,
      alphaTest: 0,
    });
    return material;
  }, [lipColors, highTexture]);

  // Cleanup materials untuk mencegah kebocoran memori
  useEffect(() => {
    return () => {
      singleMaterial.dispose();
      dualStandardMaterial.dispose();
      dualHighMaterial.dispose();
    };
  }, [singleMaterial, dualStandardMaterial, dualHighMaterial]);

  // Render FaceMesh dengan material yang sesuai berdasarkan mode
  return (
    <>
      {lipColorMode === "One" && lipColors[0] && (
        <FaceMesh
          landmarks={landmarks}
          material={singleMaterial}
          planeSize={planeSize}
          flipHorizontal={isFlipped}
        />
      )}

      {(lipColorMode === "Dual" || lipColorMode === "Ombre") && (
        <>
          {lipColors[0] && (
            <FaceMesh
              landmarks={landmarks}
              material={dualStandardMaterial}
              planeSize={planeSize}
              flipHorizontal={isFlipped}
            />
          )}
          {lipColors[1] && (
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

const LipColor: React.FC<LipColorProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <LipColorInner {...props} />
    </Suspense>
  );
};

export default LipColor;
