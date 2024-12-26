import { MeshProps, useLoader } from "@react-three/fiber";
import React, { useMemo, Suspense } from "react";
import { MeshBasicMaterial, TextureLoader } from "three";
import FaceMesh from "../face-mesh";
import { Landmark } from "../../../types/landmark";
import { RADIANCE_ALPHA } from "../../../utils/constants";

interface RadianceProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const RadianceInner: React.FC<RadianceProps> = ({ landmarks, planeSize }) => {
  const radianceTexture = useLoader(TextureLoader, RADIANCE_ALPHA);

  const radianceMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: "#FFFF",
        transparent: true,
        opacity: 0.9,
        alphaMap: radianceTexture,
        alphaTest: 0,
      }),
    [],
  );

  return (
    <FaceMesh
      landmarks={landmarks}
      material={radianceMaterial}
      planeSize={[planeSize[0], planeSize[1]]}
    />
  );
};

const Radiance: React.FC<RadianceProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <RadianceInner {...props} />
    </Suspense>
  );
};

export default Radiance;
