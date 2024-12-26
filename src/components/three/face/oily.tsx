import { MeshProps, useLoader } from "@react-three/fiber";
import React, { useMemo, Suspense } from "react";
import { MeshBasicMaterial, TextureLoader } from "three";
import FaceMesh from "../face-mesh";
import { Landmark } from "../../../types/landmark";
import { OILY_ALPHA } from "../../../utils/constants";

interface OilyProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const OilyInner: React.FC<OilyProps> = ({ landmarks, planeSize }) => {
  const oilyTexture = useLoader(TextureLoader, OILY_ALPHA);

  const oilyMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: "#bc5eff",
        transparent: true,
        opacity: 0.15,
        alphaMap: oilyTexture,
        alphaTest: 0,
      }),
    [],
  );

  return (
    <FaceMesh
      landmarks={landmarks}
      material={oilyMaterial}
      planeSize={[planeSize[0], planeSize[1]]}
      flipHorizontal={true}
    />
  );
};

const Oily: React.FC<OilyProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <OilyInner {...props} />
    </Suspense>
  );
};

export default Oily;
