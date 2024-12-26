import { MeshProps, useLoader } from "@react-three/fiber";
import React, { useMemo, Suspense } from "react";
import { MeshBasicMaterial, TextureLoader } from "three";
import FaceMesh from "../face-mesh";
import { Landmark } from "../../../types/landmark";
import { useMakeup } from "../../../context/makeup-context";
import { CONCEALER_TEXTURE } from "../../../utils/constants";

interface ConcealerProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
  isFlipped: boolean;
}

const ConcealerInner: React.FC<ConcealerProps> = ({
  landmarks,
  planeSize,
  isFlipped,
}) => {
  const { concealerColor } = useMakeup();

  const concealerTexture = useLoader(TextureLoader, CONCEALER_TEXTURE);

  const concealerMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: concealerColor,
        transparent: true,
        opacity: 0.36,
        alphaMap: concealerTexture,
        alphaTest: 0,
      }),
    [concealerColor],
  );

  return (
    <FaceMesh
      landmarks={landmarks}
      material={concealerMaterial}
      planeSize={[planeSize[0], planeSize[1]]}
      flipHorizontal={isFlipped}
    />
  );
};

const Concealer: React.FC<ConcealerProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <ConcealerInner {...props} />
    </Suspense>
  );
};

export default Concealer;
