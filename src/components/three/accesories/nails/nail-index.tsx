import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense, useEffect } from "react";
import { Mesh, MeshStandardMaterial, Object3D } from "three";
import { Landmark } from "../../../../types/landmark";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { calculateDistance } from "../../../../utils/calculateDistance";
import { handQuaternion } from "../../../../utils/handOrientation";
import { useAccesories } from "../../../../context/accesories-context";
import { NAILS } from "../../../../utils/constants";
import { useMakeup } from "../../../../context/makeup-context";

interface NailIndexProps extends MeshProps {
  handLandmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const NailIndexInner: React.FC<NailIndexProps> = React.memo(
  ({ handLandmarks, planeSize }) => {
    const nailsRef = useRef<Object3D | null>(null);
    const { scene } = useThree();
    const { envMapAccesories } = useAccesories();
    const { showNails, nailsColor } = useMakeup();
    const outputWidth = planeSize[0];
    const outputHeight = planeSize[1];

    useEffect(() => {
      const loader = new GLTFLoader();
      loader.load(
        NAILS,
        (gltf) => {
          const nails = gltf.scene;
          nails.traverse((child) => {
            if ((child as Mesh).isMesh) {
              const mesh = child as Mesh;
              if (mesh.material instanceof MeshStandardMaterial) {
                mesh.material.envMap = envMapAccesories;
                mesh.material.needsUpdate = true;
                mesh.material.visible = showNails;
                mesh.material.color.set(nailsColor);
                mesh.material.transparent = true;
                mesh.material.opacity = 0.3;
              }
              child.renderOrder = 4;
            }
          });

          nailsRef.current = nails;
          scene.add(nails);
        },
        undefined,
        (error) => {
          console.error("An error occurred loading the nails model: ", error);
        },
      );

      return () => {
        if (nailsRef.current) {
          scene.remove(nailsRef.current);
        }
      };
    }, [scene]);

    useFrame(() => {
      if (!handLandmarks.current || !nailsRef.current) return;
      if (handLandmarks.current.length > 0) {
        const middleFingerMCP = handLandmarks.current[9];
        const nailsFingerMCP = handLandmarks.current[13];
        const nailsFingerDIP = handLandmarks.current[8];
        const thumbBase = handLandmarks.current[1];
        const pinkyBase = handLandmarks.current[17];
        const middleFingerPIP = handLandmarks.current[10];

        const isPalmFacingBack = thumbBase.z > pinkyBase.z;
        const isLeftHand = thumbBase.x > pinkyBase.x;
        const fingerSize = calculateDistance(middleFingerMCP, nailsFingerMCP);
        const pipToDipDistance = calculateDistance(middleFingerPIP, nailsFingerDIP);
        const mcpToPipDistance = calculateDistance(middleFingerMCP, middleFingerPIP);

        const isFingerBent = pipToDipDistance < mcpToPipDistance * 0.8;
        const isPalmFacingCamera = !isPalmFacingBack;

        if (isPalmFacingCamera && !isFingerBent) {
          nailsRef.current.visible = false;
          return;
        }
        if (!isPalmFacingBack && isFingerBent || isPalmFacingBack && !isFingerBent) {
          nailsRef.current.visible = true;
        }
        const nailsFingerZ = 240;
        let nailsFingerX: number;
        let nailsFingerY: number;

        if (isPalmFacingBack) {
          if (isLeftHand) {
            nailsFingerX = (1 - nailsFingerDIP.x - 0.499) * outputWidth;
            nailsFingerY = -(nailsFingerDIP.y - 0.507) * outputHeight;
          } else {
            nailsFingerX = (1 - nailsFingerDIP.x - 0.498) * outputWidth;
            nailsFingerY = -(nailsFingerDIP.y - 0.502) * outputHeight;
          }
        } else {
          if (isLeftHand) {
            nailsFingerX = (1 - nailsFingerDIP.x - 0.495) * outputWidth;
            nailsFingerY = -(nailsFingerDIP.y - 0.519) * outputHeight;
          } else {
            nailsFingerX = (1 - nailsFingerDIP.x - 0.501) * outputWidth;
            nailsFingerY = -(nailsFingerDIP.y - 0.515) * outputHeight;
          }
        }
        const scaleFactor = (fingerSize * outputWidth) / 6;
        const quaternion = handQuaternion(handLandmarks.current);
        nailsRef.current.position.set(nailsFingerX, nailsFingerY, nailsFingerZ);

        if (quaternion) {
          nailsRef.current.setRotationFromQuaternion(quaternion);
        }
        console.log(isPalmFacingBack)
        if (isPalmFacingBack) {
          if (isLeftHand) {
            nailsRef.current.rotation.y += 9.5;
            nailsRef.current.scale.set(scaleFactor * 1.6, scaleFactor, scaleFactor * 1.75);
          } else {
            nailsRef.current.rotation.y += 9.4;
            nailsRef.current.scale.set(scaleFactor * 1.6, scaleFactor, scaleFactor * 1.75);
          }
        } else if (isFingerBent) {
          if (isLeftHand) {
            nailsRef.current.rotation.y += 0.15;
            nailsRef.current.scale.set(scaleFactor * 2.6, scaleFactor, scaleFactor * 3.08);
          } else {
            nailsRef.current.rotation.y -= 0.1;
            nailsRef.current.scale.set(scaleFactor * 2.6, scaleFactor, scaleFactor * 3.08);
          }
        }

        nailsRef.current.traverse((child) => {
          if ((child as Mesh).isMesh) {
            const mesh = child as Mesh;
            if (mesh.material instanceof MeshStandardMaterial) {
              mesh.material.color.set(nailsColor);
              mesh.material.needsUpdate = true;
            }
          }
        });
      } else {
        nailsRef.current.visible = false;
      }
    });

    return null;
  },
);

const NailIndex: React.FC<NailIndexProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <NailIndexInner {...props} />
    </Suspense>
  );
};

export default NailIndex;
