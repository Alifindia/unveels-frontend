import { MeshProps, useLoader } from "@react-three/fiber";
import React, { useMemo, Suspense } from "react";
import { MeshBasicMaterial, TextureLoader } from "three";
import FaceMesh from "../face-mesh";
import { Landmark } from "../../../types/landmark";
import { DRY_ALPHA } from "../../../utils/constants";

interface DryProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const DryInner: React.FC<DryProps> = ({ landmarks, planeSize }) => {
  const dryTexture = useLoader(TextureLoader, DRY_ALPHA);

  const dryMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: "#bababa",
        transparent: true,
        opacity: 0.25,
        alphaMap: dryTexture,
        alphaTest: 0,
      }),
    [],
  );

  return (
    <FaceMesh
      landmarks={landmarks}
      material={dryMaterial}
      planeSize={[planeSize[0], planeSize[1]]}
    />
  );
};

const Dry: React.FC<DryProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <DryInner {...props} />
    </Suspense>
  );
};

export default Dry;
