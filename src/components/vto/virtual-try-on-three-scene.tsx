import React, { useEffect, useImperativeHandle, useRef, useState } from "react";
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
import EyeShadow from "../three/makeup/eyeshadow";
import Eyeliner from "../three/makeup/eyeliner";
import { useCamera } from "../../context/recorder-context";
import NailThumb from "../three/accesories/nails/nail-thumb";
import NailMidlle from "../three/accesories/nails/nail-middle";
import NailIndex from "../three/accesories/nails/nail-index";
import NailRing from "../three/accesories/nails/nail-ring";
import NailPinky from "../three/accesories/nails/nail-pinky";
import FingerOccluder from "../three/accesories/finger-occluder";

interface VirtualTryOnThreeSceneProps extends MeshProps {
  videoRef: React.RefObject<Webcam | HTMLVideoElement | HTMLImageElement>;
  landmarks: React.RefObject<Landmark[]>;
  handlandmarks: React.RefObject<Landmark[]>;
  faceTransform: React.RefObject<number[]>;
  blendshape: React.RefObject<Blendshape[]>;
  sourceType: "LIVE" | "VIDEO" | "IMAGE";
  hairMask: React.RefObject<ImageData> | null;
}

const VirtualTryOnThreeScene: React.FC<VirtualTryOnThreeSceneProps> = ({
  videoRef,
  landmarks,
  handlandmarks,
  faceTransform,
  blendshape,
  sourceType,
  hairMask,
  ...props
}) => {
  const { gl } = useThree();
  const flipped = true;
  const { viewport } = useThree();
  const [planeSize, setPlaneSize] = useState<[number, number]>([1, 1]);
  const [videoTexture, setVideoTexture] = useState<
    VideoTexture | Texture | null
  >(null);
  const { skinToneThreeSceneRef, setScreenshotImage } = useCamera();
  const hairMaskTextureRef = useRef<Texture | null>(null);

  const [maskOpacity, setMaskOpacity] = useState(1);

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
    showEyeShadow,
    showEyeliner,
    showNails,
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
  const [archFactor, setArchFactor] = useState(0.0);
  const [pinchFactor, setPinchFactor] = useState(0.0);
  const [horizontalShiftFactor, setHorizontalShiftFactor] = useState(0);
  const [verticalShiftFactor, setVerticalShiftFactor] = useState(0);

  // Konversi ImageData menjadi RGBA dengan transparansi
  const processImageDataWithTransparency = (
    imageData: ImageData,
  ): ImageData => {
    const data = new Uint8ClampedArray(imageData.data); // Salin data
    for (let i = 0; i < data.length; i += 4) {
      const maskValue = data[i]; // Nilai mask disimpan di channel Red
      if (maskValue === 0) {
        // Jika bukan bagian mask, buat transparan
        data[i + 3] = 0; // Alpha = 0
      } else {
        // Jika bagian mask, pastikan alpha penuh
        data[i + 3] = 255; // Alpha = 255
      }
    }
    return new ImageData(data, imageData.width, imageData.height);
  };

  const imageDataToImage = (imageData: ImageData): HTMLImageElement => {
    const processedImageData = processImageDataWithTransparency(imageData);
    const canvas = document.createElement("canvas");
    canvas.width = processedImageData.width;
    canvas.height = processedImageData.height;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.putImageData(processedImageData, 0, 0);
      const img = new Image();
      img.src = canvas.toDataURL();
      return img;
    }
    return new Image();
  };

  // Handle source changes and create texture
  useEffect(() => {
    const source = videoRef.current;

    if (!source) {
      setVideoTexture(null);
      return;
    }

    const videoElement = source instanceof Webcam ? source.video : source;

    // Cleanup previous texture
    if (videoTexture) {
      videoTexture.dispose();
      setVideoTexture(null);
    }

    const handleCanPlay = () => {
      if (videoElement instanceof HTMLVideoElement) {
        videoElement.play();
        const texture = new VideoTexture(videoElement);
        texture.minFilter = LinearFilter;
        texture.magFilter = LinearFilter;
        texture.format = RGBFormat;
        setVideoTexture(texture);
        console.log("VideoTexture created");
      } else if (source instanceof HTMLImageElement) {
        const loader = new TextureLoader();
        loader.load(source.src, (texture) => {
          setVideoTexture(texture);
          console.log("ImageTexture created");
        });
      }
    };

    if (
      videoElement instanceof HTMLVideoElement &&
      videoElement.readyState >= 2
    ) {
      handleCanPlay();
    } else if (videoElement instanceof HTMLVideoElement) {
      videoElement.addEventListener("canplay", handleCanPlay);
      return () => {
        videoElement.removeEventListener("canplay", handleCanPlay);
      };
    } else if (source instanceof HTMLImageElement) {
      handleCanPlay();
    }
  }, [videoRef, sourceType]); // Depend on `videoRef` and `sourceType`

  // Update plane size based on source aspect ratio and viewport
  useEffect(() => {
    if (!videoTexture || !videoRef.current) return;

    const source = videoRef.current;
    let imageAspect = 1;

    const videoElement = source instanceof Webcam ? source.video : source;

    if (videoElement instanceof HTMLVideoElement) {
      imageAspect = videoElement.videoWidth / videoElement.videoHeight;
    } else if (source instanceof HTMLImageElement) {
      imageAspect = source.naturalWidth / source.naturalHeight;
    }

    const viewportAspect = viewport.width / viewport.height;
    let planeWidth: number;
    let planeHeight: number;

    if (imageAspect > viewportAspect) {
      planeHeight = viewport.height;
      planeWidth = viewport.height * imageAspect;
    } else {
      planeWidth = viewport.width;
      planeHeight = viewport.width / imageAspect;
    }

    setPlaneSize([planeWidth, planeHeight]);
  }, [videoTexture, viewport, videoRef]);

  const handleScreenshot = () => {
    requestAnimationFrame(() => {
      const canvas = gl.domElement as HTMLCanvasElement;
      console.log(canvas);
      if (canvas) {
        canvas.toBlob((blob) => {
          if (blob) {
            const imageUrl = URL.createObjectURL(blob);
            setScreenshotImage(imageUrl);
          }
        });
      }
    });
  };

  useImperativeHandle(skinToneThreeSceneRef, () => ({
    callFunction: handleScreenshot,
  }));

  // Dispose textures on unmount
  useEffect(() => {
    return () => {
      videoTexture?.dispose();
    };
  }, [videoTexture]);

  useFrame(() => {
    if (hairMask) {
      if (hairMask.current) {
        const image = imageDataToImage(hairMask.current);
        const loader = new TextureLoader();

        loader.load(image.src, (texture) => {
          if (!hairMaskTextureRef.current) {
            hairMaskTextureRef.current = texture;
          } else {
            hairMaskTextureRef.current.image = texture.image;
            hairMaskTextureRef.current.needsUpdate = true;
          }
        });
      }
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

          <>
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

            {showEyeShadow && (
              <EyeShadow
                planeSize={planeSize}
                landmarks={landmarks}
                isFlipped={isFlipped}
              />
            )}

            {showEyeliner && (
              <Eyeliner
                planeSize={planeSize}
                landmarks={landmarks}
                isFlipped={isFlipped}
              />
            )}

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

            {/* <HeadOccluder planeSize={planeSize} landmarks={landmarks} /> */}
            {/* <NeckOccluder planeSize={planeSize} landmarks={landmarks} /> */}
          </>

          {/* {showHair && ( */}
            <>
              {hairMaskTextureRef.current && (
                <mesh
                  position={[0, 0, -500]}
                  scale={[-1, 1, 1]}
                  {...props}
                  renderOrder={0}
                >
                  <planeGeometry args={[planeSize[0], planeSize[1]]} />
                  <meshBasicMaterial
                    map={hairMaskTextureRef.current}
                    side={DoubleSide}
                    transparent
                    opacity={maskOpacity}
                  />
                </mesh>
              )}
            </>
          {/* )} */}

          <>
            {/* <HandOccluder planeSize={planeSize} handLandmarks={handlandmarks} />
            <FingerOccluder
              planeSize={planeSize}
              handLandmarks={handlandmarks}
            /> */}

            {showWatch && (
              <Watch planeSize={planeSize} handLandmarks={handlandmarks} />
            )}

            {showRing && (
              <Ring planeSize={planeSize} handLandmarks={handlandmarks} />
            )}

            {showNails && (
              <>
                <NailThumb
                  planeSize={planeSize}
                  handLandmarks={handlandmarks}
                />
                <NailMidlle
                  planeSize={planeSize}
                  handLandmarks={handlandmarks}
                />
                <NailIndex
                  planeSize={planeSize}
                  handLandmarks={handlandmarks}
                />
                <NailRing planeSize={planeSize} handLandmarks={handlandmarks} />
                <NailPinky
                  planeSize={planeSize}
                  handLandmarks={handlandmarks}
                />
              </>
            )}
          </>
        </>
      )}
    </>
  );
};

export default VirtualTryOnThreeScene;
