import React, { useEffect, useRef, useMemo, useState } from "react";
import { MeshProps, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Landmark } from "../../types/landmark";
import { BilateralFilterShader } from "../../shaders/BilateralFilterShader";
import {
  Vector2,
  ShaderMaterial,
  LinearFilter,
  CanvasTexture,
  DoubleSide,
  RedFormat,
} from "three";
import { computeConvexHull } from "../../utils/imageProcessing";
import { useSkinImprovement } from "../../context/see-improvement-context";

interface SkinImprovementThreeSceneProps extends MeshProps {
  imageSrc: string;
  landmarks: Landmark[];
}

const SkinImprovementThreeScene: React.FC<SkinImprovementThreeSceneProps> = ({
  imageSrc,
  landmarks,
  ...props
}) => {
  const texture = useTexture(imageSrc);
  const { viewport, size } = useThree();
  const [planeSize, setPlaneSize] = useState<[number, number]>([1, 1]);

  const filterRef = useRef<ShaderMaterial>(null);

  // State for shader parameters
  const { sigmaSpatial, sigmaColor, smoothingStrength, setSmoothingStrength } =
    useSkinImprovement();

  // Handle window resize to update windowSize state
  const [windowSize, setWindowSize] = useState<{
    width: number;
    height: number;
    dpr: number;
  }>({
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio || 1,
  });

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

  // Fungsi untuk mengupdate smoothingStrength berdasarkan pesan yang diterima
  const updateSmoothingStrength = (newSmoothingStrength: number) => {
    console.log("Smoothing Strength updated to:", newSmoothingStrength);
    setSmoothingStrength(newSmoothingStrength);
  };

  useEffect(() => {
    // Handler untuk menerima pesan dari Flutter atau browser
    const handleMessage = (event: MessageEvent) => {
      if (event.data) {
        try {
          const data = JSON.parse(event.data);
          // Memperbarui smoothingStrength jika data yang diterima valid
          if (data.smoothingStrength !== undefined) {
            updateSmoothingStrength(data.smoothingStrength);
          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // Calculate plane size based on image aspect ratio and viewport
  // Using object-cover style (may crop parts of image to fill screen)
  useEffect(() => {
    if (!texture.image) return;

    const imageAspect = texture.image.width / texture.image.height;
    const viewportAspect = viewport.width / viewport.height;

    let planeWidth: number;
    let planeHeight: number;

    if (imageAspect > viewportAspect) {
      // Image is wider than viewport
      // For object-cover, we need to match the height and allow width to be cropped
      planeHeight = viewport.height;
      planeWidth = viewport.height * imageAspect;
    } else {
      // Image is taller than viewport
      // For object-cover, we need to match the width and allow height to be cropped
      planeWidth = viewport.width;
      planeHeight = viewport.width / imageAspect;
    }

    // For object-cover, we want the plane to be at least as large as viewport in both dimensions
    planeWidth = Math.max(planeWidth, viewport.width);
    planeHeight = Math.max(planeHeight, viewport.height);

    setPlaneSize([planeWidth, planeHeight]);
  }, [texture, viewport]);

  // Create mask texture based on landmarks directly using texture coordinates
  const maskTexture = useMemo(() => {
    if (!texture.image || landmarks.length === 0) return null;

    // Get original image dimensions
    const imgWidth = texture.image.width;
    const imgHeight = texture.image.height;

    // Create canvas with same dimensions as the original image
    const canvas = document.createElement("canvas");
    canvas.width = imgWidth;
    canvas.height = imgHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Fill with black (represents areas NOT to apply filter to)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, imgWidth, imgHeight);

    // Convert normalized landmarks to image pixel coordinates
    // IMPORTANT: We need to maintain the same proportions as the displayed image
    const points: [number, number][] = landmarks.map((landmark) => [
      landmark.x * imgWidth,
      landmark.y * imgHeight
    ]);

    // Compute Convex Hull
    const hull = computeConvexHull(points);

    if (hull.length < 3) return null; // Not enough points to form a polygon

    ctx.beginPath();
    hull.forEach(([x, y], index) => {
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.closePath();
    ctx.fillStyle = "white"; // White face area
    ctx.fill();

    // Create a Three.js texture from the canvas
    const mask = new CanvasTexture(canvas);
    mask.minFilter = LinearFilter;
    mask.magFilter = LinearFilter;
    mask.format = RedFormat;
    mask.needsUpdate = true;
    return mask;
  }, [landmarks, texture.image]);

  // Reference to the ShaderMaterial to update uniforms dynamically
  useEffect(() => {
    if (filterRef.current && maskTexture) {
      filterRef.current.uniforms.imageTexture.value = texture;
      filterRef.current.uniforms.maskTexture.value = maskTexture;
      filterRef.current.uniforms.resolution.value.set(
        texture.image.width,
        texture.image.height
      );
      filterRef.current.uniforms.sigmaSpatial.value = sigmaSpatial;
      filterRef.current.uniforms.sigmaColor.value = sigmaColor;
      filterRef.current.uniforms.smoothingStrength.value = smoothingStrength;
      filterRef.current.needsUpdate = true;
    }
  }, [texture, maskTexture, sigmaSpatial, sigmaColor, smoothingStrength]);

  return (
    <>
      {maskTexture && (
        <mesh position={[0, 0, -10]} {...props}>
          <planeGeometry args={[planeSize[0], planeSize[1]]} />
          <shaderMaterial
            ref={filterRef}
            args={[
              {
                vertexShader: BilateralFilterShader.vertexShader,
                fragmentShader: BilateralFilterShader.fragmentShader,
                side: DoubleSide,
                uniforms: {
                  imageTexture: { value: texture },
                  maskTexture: { value: maskTexture },
                  resolution: {
                    value: new Vector2(
                      texture.image.width,
                      texture.image.height
                    ),
                  },
                  sigmaSpatial: { value: sigmaSpatial },
                  sigmaColor: { value: sigmaColor },
                  smoothingStrength: { value: smoothingStrength },
                },
              },
            ]}
          />
        </mesh>
      )}
    </>
  );
};

export default SkinImprovementThreeScene;