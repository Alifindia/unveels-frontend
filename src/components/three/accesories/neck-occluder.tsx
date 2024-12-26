import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense, useEffect } from "react";
import { Mesh, MeshBasicMaterial, Object3D } from "three";
import { Landmark } from "../../../types/landmark";
import { NECK_OCCLUDER } from "../../../utils/constants";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { calculateDistance } from "../../../utils/calculateDistance";
import { calculateFaceOrientation } from "../../../utils/calculateFaceOrientation";

interface NeckOccluderProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const NeckOccluderInner: React.FC<NeckOccluderProps> = React.memo(
  ({ landmarks, planeSize }) => {
    const occluderRef = useRef<Object3D | null>(null);
    const { scene, viewport } = useThree();

    const outputWidth = planeSize[0];
    const outputHeight = planeSize[1];

    const { scaleMultiplier, neckDistanceY } = useMemo(() => {
      if (viewport.width > 1200) {
        return { scaleMultiplier: 250, neckDistanceY: 400 };
      }
      return { scaleMultiplier: 100, neckDistanceY: 250 };
    }, [viewport.width]);

    useEffect(() => {
      const loader = new GLTFLoader();
      loader.load(
        NECK_OCCLUDER,
        (gltf) => {
          const occluder = gltf.scene;
          occluder.traverse((child) => {
            if ((child as Mesh).isMesh) {
              const mesh = child as Mesh;
              mesh.material = new MeshBasicMaterial({
                colorWrite: false,
                depthWrite: true,
              });
              mesh.renderOrder = 2;
            }
          });

          occluderRef.current = occluder;
          scene.add(occluder);
          console.log("Occluder model loaded successfully");
        },
        undefined,
        (error) => {
          console.error(
            "An error occurred loading the occluder model: ",
            error,
          );
        },
      );

      return () => {
        if (occluderRef.current) {
          scene.remove(occluderRef.current);
        }
      };
    }, [scene]);

    useFrame(() => {
      if (!landmarks.current || !occluderRef.current) return;

      const neckLandmark = landmarks.current[0];

      const neckDistance =
        calculateDistance(landmarks.current[197], landmarks.current[152]) * 800;

      // Scale coordinates proportionally with the viewport
      const scaleX = viewport.width / outputWidth;
      const scaleY = viewport.height / outputHeight;

      const neckLandmarkX =
        (1 - neckLandmark.x) * outputWidth * scaleX - viewport.width / 2;
      const neckLandmarkY =
        -neckLandmark.y * outputHeight * scaleY + viewport.height / 2;
      const neckLandmarkZ = -neckLandmark.z * 100;

      const faceSize = calculateDistance(
        landmarks.current[162],
        landmarks.current[389],
      );

      const scaleFactor = faceSize * Math.min(scaleX, scaleY) * scaleMultiplier;

      if (neckLandmark) {
        occluderRef.current.position.set(
          (neckLandmarkX / 6) * 2,
          neckLandmarkY - neckDistance + neckDistance - neckDistanceY,
          0,
        );

        occluderRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
      }
    });

    return null;
  },
);

const NeckOccluder: React.FC<NeckOccluderProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <NeckOccluderInner {...props} />
    </Suspense>
  );
};

export default NeckOccluder;
