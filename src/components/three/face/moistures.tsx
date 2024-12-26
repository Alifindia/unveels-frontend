import { MeshProps, useLoader } from "@react-three/fiber";
import React, { useMemo, Suspense } from "react";
import { MeshBasicMaterial, TextureLoader } from "three";
import FaceMesh from "../face-mesh";
import { Landmark } from "../../../types/landmark";
import { MOISTURES_ALPHA } from "../../../utils/constants";

interface MoisturesProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const MoisturesInner: React.FC<MoisturesProps> = ({ landmarks, planeSize }) => {
  const moisturesTexture = useLoader(TextureLoader, MOISTURES_ALPHA);

  const moisturesMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: "#bc5eff",
        transparent: true,
        opacity: 0.15,
        alphaMap: moisturesTexture,
        alphaTest: 0,
      }),
    [],
  );

  return (
    <FaceMesh
      landmarks={landmarks}
      material={moisturesMaterial}
      planeSize={[planeSize[0], planeSize[1]]}
      flipHorizontal={true}
    />
  );
};

const Moistures: React.FC<MoisturesProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <MoisturesInner {...props} />
    </Suspense>
  );
};

export default Moistures;
