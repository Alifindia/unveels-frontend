import { MeshProps, useLoader } from "@react-three/fiber";
import React, { useMemo, Suspense } from "react";
import { MeshBasicMaterial, TextureLoader } from "three";
import FaceMesh from "../face-mesh";
import { Landmark } from "../../../types/landmark";
import { FIRMNESS_ALPHA } from "../../../utils/constants";

interface FirmnessProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const FirmnessInner: React.FC<FirmnessProps> = ({ landmarks, planeSize }) => {
  const firmnessTexture = useLoader(TextureLoader, FIRMNESS_ALPHA);

  const firmnessMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: "#75fff4",
        transparent: true,
        opacity: 0.15,
        alphaMap: firmnessTexture,
        alphaTest: 0,
      }),
    [],
  );

  return (
    <FaceMesh
      landmarks={landmarks}
      material={firmnessMaterial}
      planeSize={[planeSize[0], planeSize[1]]}
    />
  );
};

const Firmness: React.FC<FirmnessProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <FirmnessInner {...props} />
    </Suspense>
  );
};

export default Firmness;
