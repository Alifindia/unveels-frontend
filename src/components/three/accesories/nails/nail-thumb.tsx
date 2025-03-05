import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense, useEffect } from "react";
import { BackSide, Mesh, MeshStandardMaterial, Object3D } from "three";
import { Landmark } from "../../../../types/landmark";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { calculateDistance } from "../../../../utils/calculateDistance";
import { fingerTipQuaternion, FingerType, handQuaternion } from "../../../../utils/handOrientation";
import { useAccesories } from "../../../../context/accesories-context";
import { NAILS, PRESS_ON_NAILS_ONE } from "../../../../utils/constants";
import { useMakeup } from "../../../../context/makeup-context";

interface NailThumbProps extends MeshProps {
  handLandmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const NailThumbInner: React.FC<NailThumbProps> = React.memo(
  ({ handLandmarks, planeSize }) => {
    const nailsRef = useRef<Object3D | null>(null);
    const { scene, viewport } = useThree();
    const { envMapAccesories } = useAccesories();
    const { nailsColor } = useMakeup();

    const outputWidth = planeSize[0];
    const outputHeight = planeSize[1];

    useEffect(() => {
      const loader = new GLTFLoader();
      loader.load(
        PRESS_ON_NAILS_ONE,
        (gltf) => {
          const ring = gltf.scene;
          ring.traverse((child) => {
            if ((child as Mesh).isMesh) {
              const mesh = child as Mesh;
              if (mesh.material instanceof MeshStandardMaterial) {
                mesh.material.envMap = envMapAccesories;
                // mesh.material.color.set(nailsColor); // Set initial color
                mesh.material.side = BackSide;
                mesh.material.transparent = true;
                mesh.material.opacity = 1;
                mesh.material.needsUpdate = true;
              }
              child.renderOrder = 4;
            }
          });

          nailsRef.current = ring;
          scene.add(ring);
          console.log("Ring model loaded successfully");
        },
        undefined,
        (error) => {
          console.error("An error occurred loading the ring model: ", error);
        },
      );

      return () => {
        if (nailsRef.current) {
          scene.remove(nailsRef.current);
        }
      };
    }, [scene, envMapAccesories, nailsColor]); // Adding nailsColor to the dependency array

    useFrame(() => {
      if (!handLandmarks.current || !nailsRef.current) return;
      if (handLandmarks.current.length > 0) {
        nailsRef.current.visible = true;
        const middleFingerMCP = handLandmarks.current[9];
        const nailsFingerMCP = handLandmarks.current[13];
        const nailsFingerDIP = handLandmarks.current[4];

        const fingerSize = calculateDistance(middleFingerMCP, nailsFingerMCP);

        const nailsFingerX = (1 - nailsFingerDIP.x - 0.5) * outputWidth;
        const nailsFingerY = -(nailsFingerDIP.y - 0.5) * outputHeight;
        const nailsFingerZ = 200;

        const scaleFactor = (fingerSize * outputWidth) / 2.4;

        nailsRef.current.position.set(nailsFingerX, nailsFingerY, nailsFingerZ);
        nailsRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);

        const quaternion = fingerTipQuaternion(handLandmarks.current, FingerType.THUMB);

        if (quaternion) {
          nailsRef.current.setRotationFromQuaternion(quaternion);
        }

        // Update nail color dynamically during the frame
        if (nailsRef.current) {
          nailsRef.current.traverse((child) => {
            if ((child as Mesh).isMesh) {
              const mesh = child as Mesh;
              if (mesh.material instanceof MeshStandardMaterial) {
                // mesh.material.color.set(nailsColor); // Dynamically update color
                mesh.material.needsUpdate = true;
              }
            }
          });
        }
      } else {
        nailsRef.current.visible = false;
      }
    });

    return null;
  },
);

const NailThumb: React.FC<NailThumbProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <NailThumbInner {...props} />
    </Suspense>
  );
};

export default NailThumb;