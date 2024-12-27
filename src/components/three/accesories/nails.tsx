import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense, useEffect } from "react";
import { Mesh, MeshStandardMaterial, Object3D } from "three";
import { Landmark } from "../../../types/landmark";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { calculateDistance } from "../../../utils/calculateDistance";
import { handQuaternion } from "../../../utils/handOrientation";
import { useAccesories } from "../../../context/accesories-context";
import { NAILS } from "../../../utils/constants";
import { useMakeup } from "../../../context/makeup-context";

interface NailsProps extends MeshProps {
  handLandmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const NailsInner: React.FC<NailsProps> = React.memo(
  ({ handLandmarks, planeSize }) => {
    const nailsRefs = useRef<(Object3D | null)[]>([]); // Create an array of references
    const { scene, viewport } = useThree();
    const { envMapAccesories } = useAccesories();
    const { nailsColor } = useMakeup();

    const outputWidth = planeSize[0];
    const outputHeight = planeSize[1];

    const { scaleMultiplier } = useMemo(() => {
      if (viewport.width > 1200) {
        return { scaleMultiplier: 500 };
      }
      return { scaleMultiplier: 500 };
    }, [viewport.width]);

    useEffect(() => {
      const loader = new GLTFLoader();
      loader.load(
        NAILS,
        (gltf) => {
          const ring = gltf.scene;
          ring.traverse((child) => {
            if ((child as Mesh).isMesh) {
              const mesh = child as Mesh;
              if (mesh.material instanceof MeshStandardMaterial) {
                mesh.material.envMap = envMapAccesories;
                mesh.material.color.set(nailsColor); // Set the nails color
                mesh.material.needsUpdate = true;
              }
              child.renderOrder = 2;
            }
          });

          // Create 4 copies of the nails model
          for (let i = 0; i < 4; i++) {
            const nailClone = ring.clone();
            nailsRefs.current.push(nailClone); // Add the clone to the nailsRefs array
            scene.add(nailClone); // Add it to the scene
          }

          console.log("Ring model loaded successfully");
        },
        undefined,
        (error) => {
          console.error("An error occurred loading the ring model: ", error);
        },
      );

      return () => {
        nailsRefs.current.forEach((nail) => {
          if (nail) {
            scene.remove(nail);
          }
        });
      };
    }, [scene, envMapAccesories, nailsColor]); // Add nailsColor to the dependency array

    useFrame(() => {
      if (!handLandmarks.current || nailsRefs.current.length === 0) return;

      const landmarksIndices = [8, 12, 16, 20]; // Landmarks indices for the nails
      const scaleX = viewport.width / outputWidth;
      const scaleY = viewport.height / outputHeight;

      landmarksIndices.forEach((index, i) => {
        if (handLandmarks.current) {
          const landmark = handLandmarks.current[index];
          if (!landmark) return;

          const nailsFingerX =
            (1 - landmark.x) * outputWidth * scaleX - viewport.width / 2;
          const nailsFingerY =
            -landmark.y * outputHeight * scaleY + viewport.height / 2;
          const nailsFingerZ = -landmark.z * 100;

          // Scale the nail object
          const fingerSize = calculateDistance(
            handLandmarks.current[9],
            handLandmarks.current[13],
          );
          const scaleFactor =
            fingerSize * Math.min(scaleX, scaleY) * scaleMultiplier;

          const nail = nailsRefs.current[i];
          if (nail) {
            nail.position.set(nailsFingerX, nailsFingerY, nailsFingerZ);
            nail.scale.set(scaleFactor, scaleFactor, scaleFactor);

            const quaternion = handQuaternion(handLandmarks.current, 7, 11);
            if (quaternion) {
              nail.setRotationFromQuaternion(quaternion);
            }

            // Update nail color dynamically
            nail.traverse((child) => {
              if ((child as Mesh).isMesh) {
                const mesh = child as Mesh;
                if (mesh.material instanceof MeshStandardMaterial) {
                  mesh.material.color.set(nailsColor);
                  mesh.material.needsUpdate = true;
                }
              }
            });
          }
        }
      });
    });

    return null;
  },
);

const Nails: React.FC<NailsProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <NailsInner {...props} />
    </Suspense>
  );
};

export default Nails;
