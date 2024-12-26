import { MeshProps, useLoader } from "@react-three/fiber";
import React, { useMemo, Suspense } from "react";
import { MeshBasicMaterial, TextureLoader } from "three";
import FaceMesh from "../face-mesh";
import { Landmark } from "../../../types/landmark";
import { DROPY_ALPHA } from "../../../utils/constants";

interface DroppyProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const DroppyInner: React.FC<DroppyProps> = ({ landmarks, planeSize }) => {
  const droppyTexture = useLoader(TextureLoader, DROPY_ALPHA);

  const droppyMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: "#383838",
        transparent: true,
        opacity: 0.6,
        alphaMap: droppyTexture,
        alphaTest: 0,
      }),
    [],
  );

  return (
    <FaceMesh
      landmarks={landmarks}
      material={droppyMaterial}
      planeSize={[planeSize[0], planeSize[1]]}
      flipHorizontal={true}
    />
  );
};

const Droppy: React.FC<DroppyProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <DroppyInner {...props} />
    </Suspense>
  );
};

export default Droppy;
