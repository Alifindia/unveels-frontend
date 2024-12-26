import { MeshProps, useLoader } from "@react-three/fiber";
import React, { useMemo, Suspense } from "react";
import { MeshBasicMaterial, TextureLoader } from "three";
import FaceMesh from "../face-mesh";
import { Landmark } from "../../../types/landmark";
import { REDNESS_ALPHA } from "../../../utils/constants";

interface RednessProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const RednessInner: React.FC<RednessProps> = ({ landmarks, planeSize }) => {
  const rednessTexture = useLoader(TextureLoader, REDNESS_ALPHA);

  const rednessMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: "#ff4545",
        transparent: true,
        opacity: 0.15,
        alphaMap: rednessTexture,
        alphaTest: 0,
      }),
    [],
  );

  return (
    <FaceMesh
      landmarks={landmarks}
      material={rednessMaterial}
      planeSize={[planeSize[0], planeSize[1]]}
    />
  );
};

const Redness: React.FC<RednessProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <RednessInner {...props} />
    </Suspense>
  );
};

export default Redness;
