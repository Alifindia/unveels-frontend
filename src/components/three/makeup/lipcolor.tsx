// LipColor.tsx
import { MeshProps, useLoader } from "@react-three/fiber";
import React, { useMemo, Suspense, useEffect } from "react";
import {
  MeshBasicMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
  TextureLoader,
} from "three";
import FaceMesh from "../face-mesh";
import { useMakeup } from "../../../context/makeup-context";
import {
  LIPS_TEXTURE_ONE,
  LIPS_TEXTURE_DUAL_UP,
  LIPS_TEXTURE_DUAL_DOWN,
  LIPS_TEXTURE_OMBRE_BASE,
  LIPS_TEXTURE_OMBRE_INNER,
  SHIMMER_TEXTURE,
} from "../../../utils/constants";
import { Landmark } from "../../../types/landmark";
import * as THREE from "three";

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
  const { lipColorMode, lipColors, envMapMakeup, lipTexture } = useMakeup();

  useEffect(() => {
    console.log("Lip Color Mode:", lipColorMode);
    console.log("Lip Colors:", lipColors);
  }, [lipColorMode, lipColors]);

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
  const shimmerTexture = useLoader(TextureLoader, SHIMMER_TEXTURE);

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
      opacity: 0.77,
      alphaMap: standardTexture,
      alphaTest: 0,
    });
    const glossyMaterial = new MeshStandardMaterial({
      color: color,
      transparent: true,
      opacity: 1,
      alphaMap: standardTexture,
      alphaTest: 0,
      metalness: 0.3,
      roughness: 0.3,
      envMap: envMapMakeup,
    });
    return lipTexture === "Glossy" ? glossyMaterial : material;
  }, [lipColors, standardTexture, lipTexture]);

  const shimmerMaterial = useMemo(() => {
    const material = new MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
      alphaMap: standardTexture,
      alphaTest: 0,
      map: shimmerTexture,
      blending: THREE.AdditiveBlending,
    });
    return material;
  }, []);

  const dualStandardMaterial = useMemo(() => {
    const color = lipColors[0] || "#FFFFFF";
    const material = new MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.77,
      alphaMap: standardTexture,
      alphaTest: 0,
    });
    const glossyMaterial = new MeshStandardMaterial({
      color: color,
      transparent: true,
      opacity: 1,
      alphaMap: standardTexture,
      alphaTest: 0,
      metalness: 0.3,
      roughness: 0.3,
      envMap: envMapMakeup,
    });
    return lipTexture === "Glossy" ? glossyMaterial : material;
  }, [lipColors, standardTexture, lipTexture]);

  const dualHighMaterial = useMemo(() => {
    const color = lipColors[1] || "#FFFFFF";
    const material = new MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.77,
      alphaMap: highTexture,
      alphaTest: 0,
    });
    const glossyMaterial = new MeshStandardMaterial({
      color: color,
      transparent: true,
      opacity: 1,
      alphaMap: highTexture,
      alphaTest: 0,
      metalness: 0.3,
      roughness: 0.3,
      envMap: envMapMakeup,
    });

    return lipTexture === "Glossy" ? glossyMaterial : material;
  }, [lipColors, highTexture, lipTexture]);

  useEffect(() => {
    return () => {
      singleMaterial.dispose();
      dualStandardMaterial.dispose();
      dualHighMaterial.dispose();
    };
  }, [singleMaterial, dualStandardMaterial, dualHighMaterial, lipTexture]);

  return (
    <>
      {lipTexture == "Shimmer" && (
        <FaceMesh
          landmarks={landmarks}
          material={shimmerMaterial}
          planeSize={planeSize}
          flipHorizontal={isFlipped}
        />
      )}

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
