import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense, useEffect } from "react";
import { BackSide, Mesh, MeshStandardMaterial, Object3D } from "three";
import { Landmark } from "../../../../types/landmark";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { calculateDistance } from "../../../../utils/calculateDistance";
import { handQuaternion } from "../../../../utils/handOrientation";
import { useAccesories } from "../../../../context/accesories-context";
import { NAILS } from "../../../../utils/constants";
import { useMakeup } from "../../../../context/makeup-context";
import { FrontSide } from "three";

interface NailRingProps extends MeshProps {
  handLandmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const NailRingInner: React.FC<NailRingProps> = React.memo(
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
        NAILS,
        (gltf) => {
          const ring = gltf.scene;
          ring.traverse((child) => {
            if ((child as Mesh).isMesh) {
              const mesh = child as Mesh;
              if (mesh.material instanceof MeshStandardMaterial) {
                mesh.material.envMap = envMapAccesories;
                mesh.material.color.set(nailsColor); // Set initial color
                mesh.material.side = FrontSide;
                mesh.material.transparent = true;
                mesh.material.opacity = 0.3;
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
        
        const thumbBase = handLandmarks.current[1]; // Pangkal ibu jari
        const pinkyBase = handLandmarks.current[17]; // Pangkal jari kelingking

        const isPalmFacingBack = thumbBase.z > pinkyBase.z;
        console.log(`Telapak tangan menghadap ${isPalmFacingBack ? "belakang" : "depan"}`);

        const middleFingerMCP = handLandmarks.current[9];
        const nailsFingerMCP = handLandmarks.current[13];
        const nailsFingerDIP = handLandmarks.current[16];

        const fingerSize = calculateDistance(middleFingerMCP, nailsFingerMCP);

        // Scale coordinates proportionally with the viewport
        const scaleX = viewport.width / outputWidth;
        const scaleY = viewport.height / outputHeight;

        const nailsFingerX = (1 - nailsFingerDIP.x - 0.492) * outputWidth;
        const nailsFingerY = -(nailsFingerDIP.y - 0.525) * outputHeight;
        const nailsFingerZ = 250;

        const scaleFactor = (fingerSize * outputWidth) / 1.7;

        nailsRef.current.position.set(nailsFingerX, nailsFingerY, nailsFingerZ);

        const quaternion = handQuaternion(handLandmarks.current, 16, 12);

        if (quaternion) {
          nailsRef.current.setRotationFromQuaternion(quaternion);
        }

        // Adjust rotation based on hand type
        if (isPalmFacingBack) {
          nailsRef.current.rotation.y += 9.6;
          nailsRef.current.scale.set(scaleFactor * 0.7, scaleFactor * 0.2, scaleFactor * 0.9); // Updated scale for longer length
        } else {
          nailsRef.current.rotation.y += 0.3;
          nailsRef.current.scale.set(scaleFactor * 0.77, scaleFactor * 0.2, scaleFactor * 0.98); // Updated scale for longer length
        }
        
        // Update nail color dynamically during the frame
        if (nailsRef.current) {
          nailsRef.current.traverse((child) => {
            if ((child as Mesh).isMesh) {
              const mesh = child as Mesh;
              if (mesh.material instanceof MeshStandardMaterial) {
                mesh.material.color.set(nailsColor); // Dynamically update color
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

const NailRing: React.FC<NailRingProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <NailRingInner {...props} />
    </Suspense>
  );
};

export default NailRing;
