import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, Suspense, useEffect } from "react";
import {
  BackSide,
  FrontSide,
  Mesh,
  MeshStandardMaterial,
  Object3D,
} from "three";
import { Landmark } from "../../../../types/landmark";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { calculateDistance } from "../../../../utils/calculateDistance";
import { handQuaternion } from "../../../../utils/handOrientation";
import { useAccesories } from "../../../../context/accesories-context";
import { NAILS } from "../../../../utils/constants";
import { useMakeup } from "../../../../context/makeup-context";

interface NailMidlleProps extends MeshProps {
  handLandmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const NailMidlleInner: React.FC<NailMidlleProps> = React.memo(
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
        const middleFingerMCP = handLandmarks.current[9];
        const nailsFingerMCP = handLandmarks.current[13];
        const nailsFingerDIP = handLandmarks.current[12];
    
        const fingerSize = calculateDistance(middleFingerMCP, nailsFingerMCP);
    
        // Scale coordinates proportionally with the viewport
        const nailsFingerX = (1 - nailsFingerDIP.x - 0.496) * outputWidth;
        const nailsFingerY = -(nailsFingerDIP.y - 0.515) * outputHeight;
        const nailsFingerZ = 200;
    
        const scaleFactor = (fingerSize * outputWidth) /2;
    
        nailsRef.current.position.set(nailsFingerX, nailsFingerY, nailsFingerZ);
        nailsRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
    
        const quaternion = handQuaternion(handLandmarks.current, 15, 12);
    
        if (quaternion) {
          nailsRef.current.setRotationFromQuaternion(quaternion);
        }
    
        // Tambahkan sedikit rotasi pada sumbu Y
        nailsRef.current.rotation.y += 0.25; // Sesuaikan nilai 0.02 untuk kecepatan rotasi
    
        // Update nail color dynamically during the frame
        nailsRef.current.traverse((child) => {
          if ((child as Mesh).isMesh) {
            const mesh = child as Mesh;
            if (mesh.material instanceof MeshStandardMaterial) {
              mesh.material.color.set(nailsColor); // Dynamically update color
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

const NailMidlle: React.FC<NailMidlleProps> = (props) => {
  return (
    <Suspense fallback={null}>
      <NailMidlleInner {...props} />
    </Suspense>
  );
};

export default NailMidlle;
