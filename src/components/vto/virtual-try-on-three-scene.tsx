import React, { useEffect, useRef, useState } from "react";
import { MeshProps, useFrame, useThree } from "@react-three/fiber";
import {
  LinearFilter,
  RGBFormat,
  VideoTexture,
  DoubleSide,
  Texture,
  TextureLoader,
} from "three";
import { ShaderMaterial, Vector2 } from "three";
import { FaceShader } from "../../shaders/FaceShader";
import Webcam from "react-webcam";
import { Landmark } from "../../types/landmark";
import Foundation from "../three/makeup/foundation";
import { useMakeup } from "../../context/makeup-context";
import Blush from "../three/makeup/blush";
import Concealer from "../three/makeup/concealer";
import Highlighter from "../three/makeup/highlighter";
import Contour from "../three/makeup/contour";
import Lipliner from "../three/makeup/lipliner";
import Lipplumper from "../three/makeup/lipplumper";
import LipColor from "../three/makeup/lipcolor";
import Bronzer from "../three/makeup/bronzer";
import ContactLens from "../three/makeup/contact-lens";
import Eyebrows from "../three/makeup/eyebrows";
import HeadOccluder from "../three/accesories/head-occluder";
import Hat from "../three/accesories/hat";
import Glasess from "../three/accesories/glasess";
import Headband from "../three/accesories/headband";
import Earring from "../three/accesories/earring";
import NeckOccluder from "../three/accesories/neck-occluder";
import Necklace from "../three/accesories/necklace";
import { useAccesories } from "../../context/accesories-context";
import HandOccluder from "../three/accesories/hand-occluder";
import Watch from "../three/accesories/watch";
import Ring from "../three/accesories/ring";
import { LoopNode } from "three/webgpu";
import FoundationNew from "../three/makeup/foundation-new";
import { Blendshape } from "../../types/blendshape";

interface VirtualTryOnThreeSceneProps extends MeshProps {
  videoRef: React.RefObject<Webcam>;
  landmarks: React.RefObject<Landmark[]>;
  handlandmarks: React.RefObject<Landmark[]>;
  faceTransform: React.RefObject<number[]>;
  blendshape: React.RefObject<Blendshape[]>;
  //hairMask: React.RefObject<ImageData>; // Tambahkan prop dataNew
}

const VirtualTryOnThreeScene: React.FC<VirtualTryOnThreeSceneProps> = ({
  videoRef,
  landmarks,
  handlandmarks,
  faceTransform,
  blendshape,
  //hairMask,
  ...props
}) => {
  const flipped = true;
  const { viewport } = useThree();
  const [planeSize, setPlaneSize] = useState<[number, number]>([1, 1]);
  const [videoTexture, setVideoTexture] = useState<VideoTexture | null>(null);
  const hairMaskTextureRef = useRef<Texture | null>(null);

  const [maskOpacity, setMaskOpacity] = useState(0.5);

  const isFlipped = true;

  const {
    showFoundation,
    showBlush,
    showConcealer,
    showHighlighter,
    showContour,
    showLipliner,
    showLipplumper,
    showLipColor,
    showBronzer,
    showLens,
    showEyebrows,
    showHair,
  } = useMakeup();

  const {
    showHat,
    showGlasess,
    showHeadband,
    showEarring,
    showNecklace,
    showWatch,
    showBracelet,
    showRing,
  } = useAccesories();

  const filterRef = useRef<ShaderMaterial>(null);

  // State for slider-controlled factors
  const [archFactor, setArchFactor] = useState(0.1);
  const [pinchFactor, setPinchFactor] = useState(0.1);
  const [horizontalShiftFactor, setHorizontalShiftFactor] = useState(0);
  const [verticalShiftFactor, setVerticalShiftFactor] = useState(0);

  // Konversi ImageData menjadi RGBA dengan transparansi
  // const processImageDataWithTransparency = (
  //   imageData: ImageData,
  // ): ImageData => {
  //   const data = new Uint8ClampedArray(imageData.data); // Salin data
  //   for (let i = 0; i < data.length; i += 4) {
  //     const maskValue = data[i]; // Nilai mask disimpan di channel Red
  //     if (maskValue === 0) {
  //       // Jika bukan bagian mask, buat transparan
  //       data[i + 3] = 0; // Alpha = 0
  //     } else {
  //       // Jika bagian mask, pastikan alpha penuh
  //       data[i + 3] = 255; // Alpha = 255
  //     }
  //   }
  //   return new ImageData(data, imageData.width, imageData.height);
  // };

  // const imageDataToImage = (imageData: ImageData): HTMLImageElement => {
  //   const processedImageData = processImageDataWithTransparency(imageData);
  //   const canvas = document.createElement("canvas");
  //   canvas.width = processedImageData.width;
  //   canvas.height = processedImageData.height;

  //   const ctx = canvas.getContext("2d");
  //   if (ctx) {
  //     ctx.putImageData(processedImageData, 0, 0);
  //     const img = new Image();
  //     img.src = canvas.toDataURL();
  //     return img;
  //   }
  //   return new Image();
  // };

  // Handle video readiness and create texture
  useEffect(() => {
    const video = videoRef.current?.video;
    if (!video) return;

    const handleCanPlay = () => {
      video.play();
      const texture = new VideoTexture(video);
      texture.minFilter = LinearFilter;
      texture.magFilter = LinearFilter;
      texture.format = RGBFormat;
      texture.needsUpdate = true;
      setVideoTexture(texture);
      console.log("VideoTexture created");
    };

    if (video.readyState >= 2) {
      // HAVE_CURRENT_DATA
      handleCanPlay();
    } else {
      video.addEventListener("canplay", handleCanPlay);
      return () => {
        video.removeEventListener("canplay", handleCanPlay);
      };
    }
  }, [videoRef]);

  // Update plane size based on video aspect ratio and viewport
  useEffect(() => {
    if (!videoTexture) return;

    const video = videoRef.current?.video;
    if (video) {
      const imageAspect = video.videoWidth / video.videoHeight;
      const viewportAspect = viewport.width / viewport.height;

      let planeWidth: number;
      let planeHeight: number;

      if (imageAspect > viewportAspect) {
        // Video is wider than viewport
        planeHeight = viewport.height;
        planeWidth = viewport.height * imageAspect;
      } else {
        // Video is taller or same aspect as viewport
        planeWidth = viewport.width;
        planeHeight = viewport.width / imageAspect;
      }

      setPlaneSize([planeWidth, planeHeight]);
    }
  }, [videoTexture, viewport, videoRef]);

  // Dispose textures on unmount
  useEffect(() => {
    return () => {
      videoTexture?.dispose();
      hairMaskTextureRef.current?.dispose();
    };
  }, [videoTexture]);

  useFrame(() => {
    // if (hairMask.current) {
    //   const image = imageDataToImage(hairMask.current);
    //   const loader = new TextureLoader();

    //   loader.load(image.src, (texture) => {
    //     if (!hairMaskTextureRef.current) {
    //       hairMaskTextureRef.current = texture;
    //     } else {
    //       hairMaskTextureRef.current.image = texture.image;
    //       hairMaskTextureRef.current.needsUpdate = true;
    //     }
    //   });
    // }

    // Pastikan material diperbarui
    if (hairMaskTextureRef.current) {
      hairMaskTextureRef.current.needsUpdate = true;
    }

    if (filterRef.current && landmarks.current) {
      const uniforms = filterRef.current.uniforms;

      // Update factor uniforms
      uniforms.archFactor.value = archFactor;
      uniforms.pinchFactor.value = pinchFactor;
      uniforms.horizontalShiftFactor.value = horizontalShiftFactor;
      uniforms.verticalShiftFactor.value = verticalShiftFactor;

      const faceLandmarks = landmarks.current;

      const leftEyebrowIndices = [63, 105, 66, 107];
      const rightEyebrowIndices = [296, 334, 293, 300];

      for (let i = 0; i < 4; i++) {
        const leftLandmark = faceLandmarks[leftEyebrowIndices[i]];
        const rightLandmark = faceLandmarks[rightEyebrowIndices[i]];

        if (leftLandmark && rightLandmark) {
          uniforms.leftEyebrow.value[i].set(
            leftLandmark.x,
            1.0 - leftLandmark.y,
          );

          uniforms.rightEyebrow.value[i].set(
            rightLandmark.x,
            1.0 - rightLandmark.y,
          );
        }
      }

      filterRef.current.needsUpdate = true;
    }
  });

  return (
    <>
      {videoTexture && (
        <>
          <mesh position={[0, 0, -500]} {...props} renderOrder={2}>
            <planeGeometry args={[planeSize[0], planeSize[1]]} />
            <shaderMaterial
              ref={filterRef}
              vertexShader={FaceShader.vertexShader}
              fragmentShader={FaceShader.fragmentShader}
              side={DoubleSide}
              uniforms={{
                videoTexture: { value: videoTexture },
                leftEyebrow: {
                  value: [
                    new Vector2(),
                    new Vector2(),
                    new Vector2(),
                    new Vector2(),
                  ],
                },
                rightEyebrow: {
                  value: [
                    new Vector2(),
                    new Vector2(),
                    new Vector2(),
                    new Vector2(),
                  ],
                },
                archFactor: { value: archFactor },
                pinchFactor: { value: pinchFactor },
                horizontalShiftFactor: { value: horizontalShiftFactor },
                verticalShiftFactor: { value: verticalShiftFactor },
              }}
            />
          </mesh>

          {/* <FoundationNew
            planeSize={planeSize}
            landmarks={landmarks}
            blendshape={blendshape}
          /> */}

          {showHair && (
            <>
              {hairMaskTextureRef.current && (
                <mesh
                  position={[0, 0, -499]}
                  scale={[-1, 1, 1]} // Flip horizontal menggunakan scale
                  {...props}
                  renderOrder={3}
                >
                  <planeGeometry args={[planeSize[0], planeSize[1]]} />
                  <meshBasicMaterial
                    map={hairMaskTextureRef.current}
                    side={DoubleSide} // Pastikan kedua sisi terlihat
                    transparent
                    opacity={maskOpacity}
                  />
                </mesh>
              )}
            </>
          )}

          {showFoundation && (
            <Foundation
              planeSize={planeSize}
              landmarks={landmarks}
              isFlipped={isFlipped}
            />
          )}

          {showBlush && (
            <Blush
              planeSize={planeSize}
              landmarks={landmarks}
              isFlipped={isFlipped}
            />
          )}

          {showConcealer && (
            <Concealer
              planeSize={planeSize}
              landmarks={landmarks}
              isFlipped={isFlipped}
            />
          )}

          {showHighlighter && (
            <Highlighter
              planeSize={planeSize}
              landmarks={landmarks}
              isFlipped={isFlipped}
            />
          )}

          {showContour && (
            <Contour
              planeSize={planeSize}
              landmarks={landmarks}
              isFlipped={isFlipped}
            />
          )}

          {showLipliner && (
            <Lipliner
              planeSize={planeSize}
              landmarks={landmarks}
              isFlipped={isFlipped}
            />
          )}

          {showLipplumper && (
            <Lipplumper
              planeSize={planeSize}
              landmarks={landmarks}
              isFlipped={isFlipped}
            />
          )}

          {showLipColor && (
            <LipColor
              planeSize={planeSize}
              landmarks={landmarks}
              isFlipped={isFlipped}
            />
          )}

          {showBronzer && (
            <Bronzer
              planeSize={planeSize}
              landmarks={landmarks}
              isFlipped={isFlipped}
            />
          )}

          {showLens && (
            <ContactLens planeSize={planeSize} landmarks={landmarks} />
          )}

          {showEyebrows && (
            <Eyebrows
              planeSize={planeSize}
              landmarks={landmarks}
              isFlipped={isFlipped}
            />
          )}

          {/* <HeadOccluder planeSize={planeSize} landmarks={landmarks} />
          <NeckOccluder planeSize={planeSize} landmarks={landmarks} />
          <HandOccluder planeSize={planeSize} handLandmarks={handlandmarks} /> */}

          {showHat && <Hat planeSize={planeSize} landmarks={landmarks} />}

          {showGlasess && (
            <Glasess planeSize={planeSize} landmarks={landmarks} />
          )}

          {showHeadband && (
            <Headband planeSize={planeSize} landmarks={landmarks} />
          )}

          {showEarring && (
            <Earring planeSize={planeSize} landmarks={landmarks} />
          )}

          {showNecklace && (
            <Necklace planeSize={planeSize} landmarks={landmarks} />
          )}

          {showWatch && (
            <Watch planeSize={planeSize} handLandmarks={handlandmarks} />
          )}

          {showRing && (
            <Ring planeSize={planeSize} handLandmarks={handlandmarks} />
          )}
        </>
      )}
    </>
  );
};

export default VirtualTryOnThreeScene;
