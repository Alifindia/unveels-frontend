import { MeshProps, useLoader } from "@react-three/fiber";
import React, { useMemo, Suspense } from "react";
import { MeshBasicMaterial, TextureLoader } from "three";
import FaceMesh from "../face-mesh";
import { Landmark } from "../../../types/landmark";
import { DARK_CIRCLE_ALPHA } from "../../../utils/constants";

interface DarkCircleProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const DarkCircleInner: React.FC<DarkCircleProps> = ({
  landmarks,
  planeSize,
}) => {
  const darkCircleTexture = useLoader(TextureLoader, DARK_CIRCLE_ALPHA);

  const darkCircleMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: "#ffa621",
        transparent: true,
        opacity: 0.15,
        alphaMap: darkCircleTexture,
        alphaTest: 0,
      }),
    [],
  );

  return (
    <FaceMesh
      landmarks={landmarks}
      material={darkCircleMaterial}
      planeSize={[planeSize[0], planeSize[1]]}
      flipHorizontal={true}
    />
  );
};

const DarkCircle: React.FC<DarkCircleProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <DarkCircleInner {...props} />
    </Suspense>
  );
};

export default DarkCircle;
