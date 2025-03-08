import React, { useEffect, useRef, useMemo, useState } from "react";
import { MeshProps, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Landmark } from "../../types/landmark";
import {
  BilateralFilterShader,
  CustomBilateralShader,
} from "../../shaders/BilateralFilterShader";
import {
  Vector2,
  ShaderMaterial,
  LinearFilter,
  CanvasTexture,
  DoubleSide,
  RedFormat,
} from "three";
import { useSkinImprovement } from "../../context/see-improvement-context";

// Define facial feature regions
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

// Define facial regions mapping type
export type FacialRegionsMap = {
  [key: string]: number[];
};

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
  const {
    sigmaSpatial,
    sigmaColor,
    smoothingStrength,
    setSmoothingStrength,
    featureType,
    setFeatureType,
  } = useSkinImprovement();

  // Define facial regions landmarks indices
  const facialRegions: FacialRegionsMap = useMemo(
    () => ({
      pipiKanan: [
        127, 34, 143, 35, 226, 31, 228, 229, 230, 231, 232, 233, 245, 188, 174,
        236, 198, 209, 129, 203, 206, 216, 172, 58, 132, 93, 234,
      ],
      pipiKiri: [
        356, 448, 449, 450, 451, 417, 429, 426, 436, 432, 434, 367, 361, 323,
      ],
      dahi: [
        54, 103, 67, 109, 10, 338, 297, 332, 284, 298, 293, 334, 296, 9, 107,
        66, 105, 63, 68,
      ],
      dagu: [
        43, 106, 182, 83, 18, 313, 406, 335, 422, 430, 394, 379, 378, 400, 377,
        152, 148, 176, 149, 150, 169, 210, 202,
      ],
      kantungMataKananAtas: [
        463, 286, 258, 257, 259, 260, 467, 359, 263, 466, 388, 387, 386, 385,
        398,
      ],
      kantungMataKiriAtas: [
        130, 33, 246, 160, 159, 158, 157, 173, 243, 190, 56, 28, 27, 29, 30,
        247,
      ],
      kantungMataKananBawah: [
        362, 382, 381, 380, 374, 373, 390, 249, 263, 359, 446, 265, 372, 345,
        352, 280, 330, 329, 277, 357,
      ],
      kantungMataKiriBawah: [
        130, 33, 7, 163, 144, 145, 153, 154, 155, 133, 243, 244, 188, 114, 47,
        100, 101, 117, 34, 35,
      ],
    }),
    [],
  );

  // Function to get active regions based on featureType
  const getActiveRegions = (
    type: FacialFeatureType,
  ): Array<keyof FacialRegionsMap> => {
    switch (type) {
      case "eyebag":
        return ["kantungMataKananBawah", "kantungMataKiriBawah"];
      case "acne":
        return ["pipiKanan", "pipiKiri", "dahi", "dagu"];
      case "dark circle":
        return ["kantungMataKananBawah", "kantungMataKiriBawah"];
      case "droopy eyelid lower":
        return ["kantungMataKananAtas", "kantungMataKiriAtas"];
      case "droopy eyelid upper":
        return ["kantungMataKananAtas", "kantungMataKiriAtas"];
      case "wrinkles":
        return ["dahi", "pipiKanan", "pipiKiri"];
      default:
        return Object.keys(facialRegions);
    }
  };

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

  // Function to update smoothingStrength based on received message
  const updateSmoothingStrength = (newSmoothingStrength: number) => {
    console.log("Smoothing Strength updated to:", newSmoothingStrength);
    setSmoothingStrength(newSmoothingStrength);
  };

  useEffect(() => {
    // Handler to receive messages from Flutter or browser
    const handleMessage = (event: MessageEvent) => {
      if (event.data) {
        try {
          const data = JSON.parse(event.data);
          // Update smoothingStrength if received
          if (data.smoothingStrength !== undefined) {
            updateSmoothingStrength(data.smoothingStrength as number);
          }
          // Update featureType if received
          if (data.featureType !== undefined) {
            setFeatureType(data.featureType as FacialFeatureType);
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

    // Fill with black (represents areas to apply blur to)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, imgWidth, imgHeight);

    // Create a temporary canvas for the feathered mask
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = imgWidth;
    tempCanvas.height = imgHeight;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return null;

    // Set shadow properties for feathering (15px blur)
    tempCtx.shadowColor = "white";
    tempCtx.shadowBlur = 15;
    tempCtx.fillStyle = "white";

    // Function to draw feature as a closed path with feathering
    const drawFeaturePath = (indices: number[]) => {
      // Check if we have enough valid landmarks
      const validPoints = indices.filter((index) => landmarks[index]);
      if (validPoints.length < 3) return; // Need at least 3 points for a path

      tempCtx.beginPath();
      indices.forEach((index, i) => {
        if (landmarks[index]) {
          const x = landmarks[index].x * imgWidth;
          const y = landmarks[index].y * imgHeight;

          if (i === 0) {
            tempCtx.moveTo(x, y);
          } else {
            tempCtx.lineTo(x, y);
          }
        }
      });

      // Close the path back to the first point
      tempCtx.closePath();
      tempCtx.fill();
    };

    // Get active regions based on current feature type
    const activeRegions = getActiveRegions(featureType);

    // Draw only the active regions
    activeRegions.forEach((region: keyof FacialRegionsMap) => {
      if (facialRegions[region]) {
        drawFeaturePath(facialRegions[region]);
      }
    });

    // Transfer the feathered mask to the main canvas
    ctx.drawImage(tempCanvas, 0, 0);

    // Create a Three.js texture from the canvas
    const mask = new CanvasTexture(canvas);
    mask.minFilter = LinearFilter;
    mask.magFilter = LinearFilter;
    mask.format = RedFormat;
    mask.needsUpdate = true;
    return mask;
  }, [landmarks, texture.image, featureType, facialRegions]);

  // Reference to the ShaderMaterial to update uniforms dynamically
  useEffect(() => {
    if (filterRef.current && maskTexture) {
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
                      texture.image.width,
                      texture.image.height,
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
