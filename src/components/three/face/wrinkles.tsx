import { MeshProps, useLoader } from "@react-three/fiber";
import React, { useMemo, Suspense } from "react";
import { MeshBasicMaterial, TextureLoader } from "three";
import FaceMesh from "../face-mesh";
import { Landmark } from "../../../types/landmark";
import { WRINKLE_ALPHA } from "../../../utils/constants";

interface WrinklesProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const WrinklesInner: React.FC<WrinklesProps> = ({ landmarks, planeSize }) => {
  const wrinklesTexture = useLoader(TextureLoader, WRINKLE_ALPHA);

  const wrinklesMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: "#11a800",
        transparent: true,
        opacity: 0.5,
        alphaMap: wrinklesTexture,
        alphaTest: 0,
      }),
    [],
  );

  return (
    <FaceMesh
      landmarks={landmarks}
      material={wrinklesMaterial}
      planeSize={[planeSize[0], planeSize[1]]}
      flipHorizontal={true}
    />
  );
};

const Wrinkles: React.FC<WrinklesProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <WrinklesInner {...props} />
    </Suspense>
  );
};

export default Wrinkles;
