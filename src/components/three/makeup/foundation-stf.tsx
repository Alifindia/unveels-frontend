import { MeshProps } from "@react-three/fiber";
import React, { useMemo, Suspense } from "react";
import { Color, MeshBasicMaterial } from "three";
import FaceMesh from "../face-mesh";
import { Landmark } from "../../../types/landmark";
import { useMakeup } from "../../../context/makeup-context";

interface FoundationSTFProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
  isFlipped: boolean;
}

const FoundationSTFInner: React.FC<FoundationSTFProps> = React.memo(
  ({ landmarks, planeSize, isFlipped }) => {
    const { foundationColor, showFoundation } = useMakeup();

    // Membuat material dengan useMemo hanya saat foundationColor berubah
    const foundationMaterial = useMemo(() => {
      return new MeshBasicMaterial({
        color: new Color(foundationColor),
        transparent: true,
        opacity: 0.05,
        visible: showFoundation,
      });
    }, [foundationColor]);

    return (
      <FaceMesh
        landmarks={landmarks}
        material={foundationMaterial}
        planeSize={planeSize}
        flipHorizontal={isFlipped}
      />
    );
  },
);

const FoundationSTF: React.FC<FoundationSTFProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <FoundationSTFInner {...props} />
    </Suspense>
  );
};

export default FoundationSTF;
