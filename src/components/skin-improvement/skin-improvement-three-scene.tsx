// Add this custom hook to your component file
import { useCallback } from 'react';

interface UseSharedWebGLRendererReturn {
  getRenderer: (width?: number, height?: number) => WebGLRenderer;
  releaseRenderer: () => void;
}

// Shared WebGL renderer hook with TypeScript types
const useSharedWebGLRenderer = (): UseSharedWebGLRendererReturn => {
  // Use a ref to store the renderer instance
  const rendererRef = useRef<WebGLRenderer | null>(null);

  // Use a ref to track if we're currently using the renderer
  const rendererInUseRef = useRef<boolean>(false);

  // Function to get or create the renderer
  const getRenderer = useCallback((width?: number, height?: number): WebGLRenderer => {
    // Mark as in use
    rendererInUseRef.current = true;

    // Create if it doesn't exist
    if (!rendererRef.current) {
      console.log("Creating new WebGL renderer");
      const renderer = new WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        premultipliedAlpha: false
      });

      // Add context lost and restored handlers
      renderer.domElement.addEventListener('webglcontextlost', (event: Event) => {
        console.log("WebGL context lost - preventing default");
        event.preventDefault();
      }, false);

      renderer.domElement.addEventListener('webglcontextrestored', () => {
        console.log("WebGL context restored");
      }, false);

      rendererRef.current = renderer;
    }

    // Resize if needed
    if (width && height) {
      rendererRef.current.setSize(width, height);
    }

    return rendererRef.current;
  }, []);

  // Function to release the renderer (doesn't dispose, just marks as not in use)
  const releaseRenderer = useCallback((): void => {
    rendererInUseRef.current = false;
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Only dispose if it exists and there are no other components using it
      if (rendererRef.current && !rendererInUseRef.current) {
        console.log("Disposing WebGL renderer on unmount");
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, []);

  return { getRenderer, releaseRenderer };
};

// Then update your component with TypeScript types:
import React, { useEffect, useRef, useMemo, useState } from "react";
import {
  MeshProps,
  useThree,
  useLoader,
  useFrame
} from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import {
  Vector2,
  ShaderMaterial,
  LinearFilter,
  DoubleSide,
  TextureLoader,
  CanvasTexture,
  BufferGeometry,
  Float32BufferAttribute,
  Uint16BufferAttribute,
  Mesh,
  WebGLRenderer,
  Scene,
  OrthographicCamera,
  MeshBasicMaterial,
  NormalBlending,
} from "three";
import { Landmark } from "../../types/landmark";
import { useSkinImprovement } from "../../context/see-improvement-context";
import { CustomBilateralShader } from "../../shaders/BilateralFilterShader";
import {
  faces,
  uvs,
  positions
} from "../../utils/constants";

// Define facial feature types
export type FacialFeatureType =
  | "acne"
  | "blackhead"
  | "dark circle"
  | "droopy eyelid lower"
  | "droopy eyelid upper"
  | "dry"
  | "eyebag"
  | "firmness"
  | "moistures"
  | "oily"
  | "pore"
  | "radiance"
  | "skinredness"
  | "spots"
  | "texture"
  | "whitehead"
  | "wrinkles";

interface SkinImprovementThreeSceneProps extends MeshProps {
  imageSrc: string;
  landmarks: Landmark[];
}

// Apply stretched landmarks for forehead
const applyStretchedLandmarks = (faceLandmarks: Landmark[]): Landmark[] => {
  return faceLandmarks.map((landmark, index) => {
    const isForehead = [54, 103, 67, 109, 10, 338, 297, 332, 284].includes(
      index,
    );

    if (isForehead) {
      const foreheadShiftY = 0.06;
      const foreheadShiftZ = 0.1;

      return {
        x: landmark.x,
        y: landmark.y - foreheadShiftY,
        z: landmark.z + foreheadShiftZ,
      };
    }
    return landmark;
  });
};

const SkinImprovementThreeScene: React.FC<SkinImprovementThreeSceneProps> = ({
  imageSrc,
  landmarks,
  ...props
}) => {
  const texture = useTexture(imageSrc);
  const { viewport } = useThree();
  const [planeSize, setPlaneSize] = useState<[number, number]>([1, 1]);
  const filterRef = useRef<ShaderMaterial | null>(null);
  const [maskTexture, setMaskTexture] = useState<CanvasTexture | null>(null);
  const materialRef = useRef<MeshBasicMaterial | null>(null);
  const geometryRef = useRef<BufferGeometry | null>(null);

  // Get shared renderer functions
  const { getRenderer, releaseRenderer } = useSharedWebGLRenderer();

  // Get parameters from skin improvement context
  const {
    sigmaSpatial,
    sigmaColor,
    smoothingStrength,
    featureType,
    setSmoothingStrength,
    setFeatureType
  } = useSkinImprovement();

  // Load alphamap texture for the specific feature
  const alphaMapPath = useMemo(() => {
    return "/media/unveels/vto-assets/texture/skin-problem/" + featureType + ".png";
  }, [featureType]);

  // We'll load the PNG texture directly
  const alphaMap = useLoader(TextureLoader, alphaMapPath);

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
      // Image is taller than viewport
      planeWidth = viewport.width;
      planeHeight = viewport.width / imageAspect;
    }

    // For object-cover, we want the plane to be at least as large as viewport in both dimensions
    planeWidth = Math.max(planeWidth, viewport.width);
    planeHeight = Math.max(planeHeight, viewport.height);

    setPlaneSize([planeWidth, planeHeight]);
  }, [texture, viewport]);

  // Function to update smoothingStrength based on received message
  const updateSmoothingStrength = (newSmoothingStrength: number) => {
    console.log("Smoothing Strength updated to:", newSmoothingStrength);
    setSmoothingStrength(newSmoothingStrength);
  };

  // Set up event listener for messages
  useEffect(() => {
    // Handler for receiving messages from Flutter or browser
    const handleMessage = (event: MessageEvent) => {
      console.log("Message received:", event);

      // Check received data
      if (event.data) {
        try {
          const data = JSON.parse(event.data);
          console.log("Parsed data:", data);

          // Update smoothingStrength if valid data is received
          if (data.smoothingStrength !== undefined) {
            updateSmoothingStrength(data.smoothingStrength);
          }

          if (data.featureType !== undefined) {
            setFeatureType(data.featureType);

          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      } else {
        console.warn("No data received in message event");
      }
    };

    // Add event listener for messages
    window.addEventListener("message", handleMessage);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // Create a temporary face mesh and render it to a canvas with the alphamap
  useEffect(() => {
    if (
      !texture.image ||
      !alphaMap ||
      !alphaMap.image ||
      landmarks.length === 0
    )
      return;

    console.log("Creating mask with shared WebGL renderer");

    // Clean up previous resources
    if (geometryRef.current) {
      geometryRef.current.dispose();
      geometryRef.current = null;
    }

    if (materialRef.current) {
      materialRef.current.dispose();
      materialRef.current = null;
    }

    // Get the shared renderer
    const renderer = getRenderer(texture.image.width, texture.image.height);

    // Clear with transparent black
    renderer.setClearColor(0x000000, 0);
    renderer.clear();

    // Create a scene
    const scene = new Scene();

    // Create a camera
    const camera = new OrthographicCamera(
      -texture.image.width / 2,
      texture.image.width / 2,
      texture.image.height / 2,
      -texture.image.height / 2,
      0.1,
      1000,
    );
    camera.position.z = 10;

    // Create a geometry for the face mesh
    const geometry = new BufferGeometry();
    geometryRef.current = geometry;

    // Apply landmark positions
    const outputWidth = texture.image.width;
    const outputHeight = texture.image.height;

    // Apply stretched landmarks
    const modifiedLandmarks = applyStretchedLandmarks(landmarks);

    // Create vertices array
    const vertices = new Float32Array(positions.length * 3);
    for (
      let i = 0;
      i < Math.min(modifiedLandmarks.length, positions.length);
      i++
    ) {
      const landmark = modifiedLandmarks[i];
      const x = (landmark.x - 0.5) * outputWidth;
      const y = -(landmark.y - 0.5) * outputHeight;
      const z = 0;

      vertices[i * 3] = x;
      vertices[i * 3 + 1] = y;
      vertices[i * 3 + 2] = z;
    }

    // Set up UV coordinates
    const uvArray = new Float32Array(uvs.length * 2);
    for (let i = 0; i < uvs.length; i++) {
      uvArray[i * 2] = uvs[i][0];
      uvArray[i * 2 + 1] = uvs[i][1];
    }

    // Set attributes and indices
    geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("uv", new Float32BufferAttribute(uvArray, 2));
    geometry.setIndex(new Uint16BufferAttribute(faces, 1));
    geometry.computeVertexNormals();

    // Create material with proper alpha settings
    const material = new MeshBasicMaterial({
      alphaMap: alphaMap,
      transparent: true,
      opacity: 1.0,
      alphaTest: 0.0,
      depthTest: false,
      depthWrite: false,
      blending: NormalBlending
    });
    materialRef.current = material;

    // Ensure texture settings are correct
    alphaMap.premultiplyAlpha = false;
    alphaMap.needsUpdate = true;

    // Create mesh and add to scene
    const mesh = new Mesh(geometry, material);
    scene.add(mesh);

    // Render the scene
    renderer.render(scene, camera);

    // Create a texture from the renderer's canvas
    const newMaskTexture = new CanvasTexture(renderer.domElement);
    newMaskTexture.minFilter = LinearFilter;
    newMaskTexture.magFilter = LinearFilter;
    newMaskTexture.needsUpdate = true;

    // Set as mask texture
    setMaskTexture(newMaskTexture);

    // Release the renderer
    releaseRenderer();

    // Clean up scene resources
    scene.remove(mesh);

    return () => {
      if (newMaskTexture) {
        newMaskTexture.dispose();
      }
    };
  }, [landmarks, texture.image, alphaMap, featureType, getRenderer, releaseRenderer]);

  // Update shader uniforms when parameters change
  useEffect(() => {
    if (filterRef.current && maskTexture && texture.image) {
      filterRef.current.uniforms.imageTexture.value = texture;
      filterRef.current.uniforms.maskTexture.value = maskTexture;
      filterRef.current.uniforms.resolution.value.set(
        texture.image.width,
        texture.image.height,
      );
      filterRef.current.uniforms.sigmaSpatial.value = sigmaSpatial;
      filterRef.current.uniforms.sigmaColor.value = sigmaColor;
      filterRef.current.uniforms.smoothingStrength.value = smoothingStrength;
      filterRef.current.needsUpdate = true;
    }
  }, [texture, maskTexture, sigmaSpatial, sigmaColor, smoothingStrength]);

  // Component cleanup on unmount
  useEffect(() => {
    return () => {
      if (geometryRef.current) {
        geometryRef.current.dispose();
        geometryRef.current = null;
      }

      if (materialRef.current) {
        materialRef.current.dispose();
        materialRef.current = null;
      }

      if (maskTexture) {
        maskTexture.dispose();
      }
    };
  }, []);

  return (
    <>
      {maskTexture && (
        <mesh position={[0, 0, -10]} {...props}>
          <planeGeometry args={[planeSize[0], planeSize[1]]} />
          <shaderMaterial
            ref={filterRef}
            args={[
              {
                vertexShader: CustomBilateralShader.vertexShader,
                fragmentShader: CustomBilateralShader.fragmentShader,
                side: DoubleSide,
                uniforms: {
                  imageTexture: { value: texture },
                  maskTexture: { value: maskTexture },
                  resolution: {
                    value: new Vector2(
                      texture.image?.width || 1,
                      texture.image?.height || 1,
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
