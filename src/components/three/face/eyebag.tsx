import { MeshProps, useLoader } from "@react-three/fiber";
import React, { useMemo, Suspense } from "react";
import { MeshBasicMaterial, TextureLoader } from "three";
import FaceMesh from "../face-mesh";
import { Landmark } from "../../../types/landmark";
import { EYEBAG_ALPHA, WRINKLE_ALPHA } from "../../../utils/constants";

interface EyebagProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const EyebagInner: React.FC<EyebagProps> = ({ landmarks, planeSize }) => {
  const eyebagTexture = useLoader(TextureLoader, EYEBAG_ALPHA);

  const eyebagMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: "#383838",
        transparent: true,
        opacity: 0.15,
        alphaMap: eyebagTexture,
        alphaTest: 0,
      }),
    [],
  );

  return (
    <FaceMesh
      landmarks={landmarks}
      material={eyebagMaterial}
      planeSize={[planeSize[0], planeSize[1]]}
      flipHorizontal={true}
    />
  );
};

const Eyebag: React.FC<EyebagProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <EyebagInner {...props} />
    </Suspense>
  );
};

export default Eyebag;
