import { MeshProps, useLoader } from "@react-three/fiber";
import React, { useMemo, Suspense } from "react";
import { MeshBasicMaterial, MeshStandardMaterial, TextureLoader } from "three";
import FaceMesh from "../face-mesh";
import { Landmark } from "../../../types/landmark";
import { useMakeup } from "../../../context/makeup-context";
import { LIP_PLUMPER_TEXTURE_ONE, SHIMMER_TEXTURE } from "../../../utils/constants";
import * as THREE from "three";

interface LipplumperProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
  isFlipped: boolean;
}

const LipplumperInner: React.FC<LipplumperProps> = ({
  landmarks,
  planeSize,
  isFlipped,
}) => {
  const { lipplumperColor, lipTexture, envMapMakeup } = useMakeup();

  const lipplumperTexture = useLoader(TextureLoader, LIP_PLUMPER_TEXTURE_ONE);

  const shimmerTexture = useLoader(TextureLoader, SHIMMER_TEXTURE);

  const lipplumperMaterial = useMemo(() => {
    return lipTexture == "Glossy"
      ? new MeshStandardMaterial({
          color: lipplumperColor,
          transparent: true,
          opacity: 1,
          alphaMap: lipplumperTexture,
          alphaTest: 0,
          metalness: 0.3,
          roughness: 0.3,
          envMap: envMapMakeup,
        })
      : new MeshBasicMaterial({
          color: lipplumperColor,
          transparent: true,
          opacity: 0.4,
          alphaMap: lipplumperTexture,
          alphaTest: 0,
        });
  }, [lipplumperColor, lipTexture]);

  const shimmerMaterial = useMemo(() => {
    const material = new MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
      alphaMap: lipplumperTexture,
      alphaTest: 0,
      map: shimmerTexture,
      blending: THREE.AdditiveBlending,
    });
    return material;
  }, []);

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
      <FaceMesh
        landmarks={landmarks}
        material={lipplumperMaterial}
        planeSize={[planeSize[0], planeSize[1]]}
        flipHorizontal={isFlipped}
      />
    </>
  );
};

const Lipplumper: React.FC<LipplumperProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <LipplumperInner {...props} />
    </Suspense>
  );
};

export default Lipplumper;
