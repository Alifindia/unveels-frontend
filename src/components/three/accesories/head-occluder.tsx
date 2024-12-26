import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense, useEffect } from "react";
import { Mesh, MeshBasicMaterial, Object3D } from "three";
import { Landmark } from "../../../types/landmark";
import { HEAD_OCCLUDER } from "../../../utils/constants";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { calculateDistance } from "../../../utils/calculateDistance";
import { calculateFaceOrientation } from "../../../utils/calculateFaceOrientation";

interface HeadOccluderProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const HeadOccluderInner: React.FC<HeadOccluderProps> = React.memo(
  ({ landmarks, planeSize }) => {
    const occluderRef = useRef<Object3D | null>(null);
    const { scene, viewport } = useThree();

    const outputWidth = planeSize[0];
    const outputHeight = planeSize[1];

    const { scaleMultiplier } = useMemo(() => {
      if (viewport.width > 1200) {
        return { scaleMultiplier: 300 };
      }
      return { scaleMultiplier: 90 };
    }, [viewport.width]);

    useEffect(() => {
      const loader = new GLTFLoader();
      loader.load(
        HEAD_OCCLUDER,
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

      const centerHead = landmarks.current[1];

      // Scale coordinates proportionally with the viewport
      const scaleX = viewport.width / outputWidth;
      const scaleY = viewport.height / outputHeight;

      const centerHeadX =
        (1 - centerHead.x) * outputWidth * scaleX - viewport.width / 2;
      const centerHeadY =
        -centerHead.y * outputHeight * scaleY + viewport.height / 2;
      const centerHeadZ = -centerHead.z * 100;

      const faceSize = calculateDistance(
        landmarks.current[162],
        landmarks.current[389],
      );

      const scaleFactor = faceSize * Math.min(scaleX, scaleY) * scaleMultiplier;

      if (centerHead) {
        occluderRef.current.position.set(centerHeadX, centerHeadY, centerHeadZ);
        occluderRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
      }

      const quaternion = calculateFaceOrientation(landmarks.current);

      if (quaternion) {
        occluderRef.current.setRotationFromQuaternion(quaternion);
      }
    });

    return null;
  },
);

const HeadOccluder: React.FC<HeadOccluderProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <HeadOccluderInner {...props} />
    </Suspense>
  );
};

export default HeadOccluder;
