import { MeshProps, useLoader } from "@react-three/fiber";
import React, { useMemo, Suspense } from "react";
import { MeshBasicMaterial, TextureLoader } from "three";
import FaceMesh from "../face-mesh";
import { Landmark } from "../../../types/landmark";
import { useMakeup } from "../../../context/makeup-context";
import { LIP_PLUMPER_TEXTURE_ONE } from "../../../utils/constants";

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
  const { lipplumperColor } = useMakeup();

  const lipplumperTexture = useLoader(TextureLoader, LIP_PLUMPER_TEXTURE_ONE);

  const lipplumperMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: lipplumperColor,
        transparent: true,
        opacity: 2,
        alphaMap: lipplumperTexture,
        alphaTest: 0,
      }),
    [lipplumperColor],
  );

  return (
    <FaceMesh
      landmarks={landmarks}
      material={lipplumperMaterial}
      planeSize={[planeSize[0], planeSize[1]]}
      flipHorizontal={isFlipped}
    />
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
