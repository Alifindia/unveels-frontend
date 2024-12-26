// src/components/scanner.tsx
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useCamera } from "../context/recorder-context";
import ScannerWorker from "../workers/scannerWorker.ts?worker";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { Landmark } from "../types/landmark";
import { Canvas, MeshProps, useFrame, useThree } from "@react-three/fiber";
import { LinearFilter, RGBFormat, ShaderMaterial, SRGBColorSpace } from "three";
import { useTexture } from "@react-three/drei";
import FaceMesh from "./three/face-mesh";

interface ScannerThreeCanvasProps extends MeshProps {
  imageSrc: string;
  landmarks: React.RefObject<Landmark[]>;
}

const ScannerThreeCanvas: React.FC<ScannerThreeCanvasProps> = ({
  imageSrc,
  landmarks,
  ...props
}) => {
  const { gl } = useThree();
  const { skinToneThreeSceneRef } = useCamera();
  const texture = useTexture(imageSrc);
  const { viewport } = useThree();
  const [planeSize, setPlaneSize] = useState<[number, number]>([1, 1]);

  // State for window size and DPR
  const [windowSize, setWindowSize] = useState<{
    width: number;
    height: number;
    dpr: number;
  }>({
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio || 1,
  });

  // Handle window resize to update windowSize state
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio || 1,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate plane size based on image aspect ratio and viewport
  useEffect(() => {
    if (!texture.image) return;

    const imageAspect = texture.image.width / texture.image.height;
    const viewportAspect = viewport.width / viewport.height;

    let planeWidth: number;
    let planeHeight: number;

    if (imageAspect > viewportAspect) {
      // Image is wider than viewport
      planeHeight = viewport.height;
      planeWidth = viewport.height * imageAspect;
    } else {
      // Image is taller or same aspect as viewport
      planeWidth = viewport.width;
      planeHeight = viewport.width / imageAspect;
    }

    texture.format = RGBFormat;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    setPlaneSize([planeWidth, planeHeight]);
  }, [texture, viewport]);

  return (
    <>
      <mesh position={[0, 0, -10]} scale={[1, 1, 1]} {...props}>
        <planeGeometry args={[planeSize[0], planeSize[1]]} />
        <meshBasicMaterial map={texture} />
      </mesh>

      <ScannerAnimation
        landmarks={landmarks}
        planeSize={[planeSize[0], planeSize[1]]}
      />
    </>
  );
};

interface ScannerAnimationProps extends MeshProps {
  landmarks: React.RefObject<Landmark[]>;
  planeSize: [number, number];
}

const ScannerAnimationInner: React.FC<ScannerAnimationProps> = React.memo(
  ({ landmarks, planeSize }) => {
    // Membuat ShaderMaterial dengan warna hijau sebagai base color
    const animationMaterial = useMemo(() => {
      return new ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          baseColor: { value: [0.0, 1.0, 0.0] }, // Warna hijau dalam RGB
        },
        vertexShader: `
              varying vec2 vUv;
  
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
        fragmentShader: `
              uniform float time;
              uniform vec3 baseColor;
              varying vec2 vUv;
  
              void main() {
                // Warna berganti menggunakan fungsi sin
                float pulse = abs(sin(time + vUv.x * 10.0));
                vec3 color = mix(baseColor, vec3(0.0, 0.5, 1.0), pulse); // Gradasi hijau ke biru
                gl_FragColor = vec4(color, 0.2); // Warna dengan transparansi
              }
            `,
        transparent: true,
      });
    }, []);

    // Update waktu setiap frame
    useFrame((state) => {
      if (animationMaterial.uniforms) {
        animationMaterial.uniforms.time.value = state.clock.getElapsedTime();
      }
    });

    return (
      <FaceMesh
        landmarks={landmarks}
        material={animationMaterial}
        planeSize={planeSize}
      />
    );
  },
);

const ScannerAnimation: React.FC<ScannerAnimationProps> = (props) => {
  return <ScannerAnimationInner {...props} />;
};

export default ScannerThreeCanvas;
