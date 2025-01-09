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
        const thumbBase = handLandmarks.current[1]; // Pangkal ibu jari
        const pinkyBase = handLandmarks.current[17]; // Pangkal jari kelingking
        const middleFingerPIP = handLandmarks.current[10]; // Middle finger PIP joint
        const middleFingerMCP = handLandmarks.current[9];  // Middle finger MCP joint
        const middleFingerDIP = handLandmarks.current[12]; // Middle finger DIP joint
        const nailsFingerMCP = handLandmarks.current[13];
    
        // Calculate distances to detect bending
        const pipToDipDistance = calculateDistance(middleFingerPIP, middleFingerDIP);
        const mcpToPipDistance = calculateDistance(middleFingerMCP, middleFingerPIP);
        const isFingerBent = pipToDipDistance < mcpToPipDistance * 0.8; // Example threshold for bending
    
        const isPalmFacingBack = thumbBase.z > pinkyBase.z; // Determine palm direction
        const isLeftHand = thumbBase.x > pinkyBase.x; // Check if it’s the left hand
    
        console.log(`Middle finger bent: ${isFingerBent}`);
        console.log(`Telapak tangan menghadap ${isPalmFacingBack ? "belakang" : "depan"}`);
        console.log(`Tangan kiri: ${isLeftHand}`);
    
        // Determine whether to show or hide the nail effect
        if (isLeftHand && !isPalmFacingBack && !isFingerBent) {
          nailsRef.current.visible = false; // Hide nails if left hand is facing the camera and finger is not bent
          return; // Skip further calculations for this frame
        } else {
          nailsRef.current.visible = true; // Show nails otherwise
        }
    
        const fingerSize = calculateDistance(middleFingerMCP, nailsFingerMCP);
        const nailsFingerZ = 200;
    
        const scaleFactor = (fingerSize * outputWidth) / 1.5;
    
        let nailsFingerX: number;
        let nailsFingerY: number;
    
        if (isPalmFacingBack) {
          nailsFingerX = (1 - middleFingerDIP.x - 0.5) * outputWidth;
          nailsFingerY = -(middleFingerDIP.y - 0.505) * outputHeight;
        } else {
          nailsFingerX = (1 - middleFingerDIP.x - 0.49) * outputWidth;
          nailsFingerY = -(middleFingerDIP.y - 0.522) * outputHeight;
        }
    
        nailsRef.current.position.set(nailsFingerX, nailsFingerY, nailsFingerZ);
    
        const quaternion = handQuaternion(handLandmarks.current, 15, 12);
    
        if (quaternion) {
          nailsRef.current.setRotationFromQuaternion(quaternion);
        }
    
        // Adjust rotation based on hand type
        if (isPalmFacingBack) {
          nailsRef.current.rotation.y += 9.5;
          nailsRef.current.scale.set(scaleFactor * 0.55, scaleFactor * 0.2, scaleFactor * 0.58); // Updated scale for longer length
        } else {
          nailsRef.current.rotation.y += 0.23;
          nailsRef.current.scale.set(scaleFactor * 0.7, scaleFactor * 0.2, scaleFactor * 0.9); // Updated scale for longer length
        }
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
