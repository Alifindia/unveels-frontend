import { useEffect, useState } from "react";
import { VirtualTryOnScene } from "../components/vto/virtual-try-on-scene";
import {
  AccesoriesProvider,
  useAccesories,
} from "../context/accesories-context";
import { MakeupProvider, useMakeup } from "../context/makeup-context";
import { CameraProvider, useCamera } from "../context/recorder-context";
import { atan } from "@tensorflow/tfjs-core";

export function VirtualTryOnWeb() {
  return (
    <CameraProvider>
      <MakeupProvider>
        <AccesoriesProvider>
          <Main />
        </AccesoriesProvider>
      </MakeupProvider>
    </CameraProvider>
  );
}

function Main() {
  const {
    setShowLipColor,
    setLipColorMode,
    setLipColors,
    setLipTexture,
    setShowLipliner,
    setLiplinerColor,
    setLiplinerPattern,
    setShowLipplumper,
    setLipplumperColor,
    setShowEyebrows,
    setEyebrowsColor,
    setEyebrowsPattern,
    setEyebrowsVisibility,
    setShowLens,
    setLensPattern,
    setShowFoundation,
    setFoundationColor,
    setShowConcealer,
    setConcealerColor,
    setShowContour,
    setContourColors,
    setContourMode,
    setContourShape,
    setShowBlush,
    setBlushColor,
    setBlushMode,
    setBlushPattern,
    setShowBronzer,
    setBronzerColor,
    setShowHighlighter,
    setHighlighterColor,
    setHighlighterPattern,
    setShowEyeShadow,
    setEyeShadowColor,
    setEyeShadowMaterial,
    setEyeShadowPattern,
    setShowLashes,
    setLashesColor,
    setLashesPattern,
    setShowMascara,
    setMascaraColor,
    setShowEyeliner,
    setEyelinerColor,
    setEyelinerPattern,
    setShowNails,
    setNailsTexture,
    setNailsColor,
    setShowHair,
    setHairColor,
  } = useMakeup();

  const {
    setShowBracelet,
    setShowGlasess,
    setShowEarring,
    setShowHat,
    setShowHeadband,
    setShowNecklace,
    setShowRing,
    setShowWatch,
  } = useAccesories();

  const { flipCamera, compareCapture, resetCapture, screenShoot } = useCamera();

  const [mode, setMode] = useState<"IMAGE" | "VIDEO" | "LIVE">("LIVE");
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  useEffect(() => {
    // Handler untuk menerima pesan
    const handleMessage = (event: MessageEvent) => {
      console.log("Message received:", event);

      if (event.data) {
        try {
          const data = JSON.parse(event.data);
          console.log("Parsed data:", data);

          if (data.lipColor !== undefined) {
            setLipColors(data.lipColor);
          }

          if (data.showLipColor !== undefined) {
            setShowLipColor(data.showLipColor);
          }

          if (data.setLipColorMode) {
            setLipColorMode(data.setLipColorMode);
          }

          if (data.lipTexture) {
            setLipTexture(data.setLipTexture);
          }

          // lipliner

          if (data.showLipliner !== undefined) {
            setShowLipliner(data.showLipliner);
          }

          if (data.liplinerPattern !== undefined) {
            setLiplinerPattern(data.liplinerPattern);
          }

          if (data.liplinerColor !== undefined) {
            setLiplinerColor(data.liplinerColor);
          }

          // lipplumper
          if (data.showLipplumper !== undefined) {
            setShowLipplumper(data.showLipplumper);
          }

          if (data.lipplumperColor !== undefined) {
            setLipplumperColor(data.lipplumperColor);
          }

          // eyebrows
          if (data.showEyebrows !== undefined) {
            setShowEyebrows(data.showEyebrows);
          }

          if (data.eyebrowsColor !== undefined) {
            setEyebrowsColor(data.setEyebrowsColor);
          }

          if (data.eyebrowsPattern !== undefined) {
            setEyebrowsPattern(data.eyebrowsPattern);
          }

          if (data.eyebrowsVisibility !== undefined) {
            setEyebrowsVisibility(data.eyebrowsVisibility);
          }

          // lashes
          if (data.showLashes !== undefined) {
            setShowLashes(data.showLashes);
          }

          if (data.lashesColor !== undefined) {
            setLashesColor(data.lashesColor);
          }

          if (data.lashesPattern !== undefined) {
            setLashesPattern(data.lashesPattern);
          }

          // mascara
          if (data.showMascara !== undefined) {
            setShowMascara(data.showMascara);
          }

          if (data.mascaraColor !== undefined) {
            setMascaraColor(data.mascaraColor);
          }

          // eyeliner
          if (data.showEyeliner !== undefined) {
            setShowEyeliner(data.showEyeliner);
          }

          if (data.eyelinerColor !== undefined) {
            setEyelinerColor(data.eyelinerColor);
          }

          if (data.eyelinerPattern !== undefined) {
            setEyelinerPattern(data.eyelinerPattern);
          }

          // lens
          if (data.showLens !== undefined) {
            setShowLens(data.showLens);
          }

          if (data.lensPattern !== undefined) {
            setLensPattern(data.lensPattern);
          }

          // foundation
          if (data.showFoundation !== undefined) {
            setShowFoundation(data.showFoundation);
          }

          if (data.foundationColor !== undefined) {
            setFoundationColor(data.foundationColor);
          }

          // concelaer
          if (data.showConcealer !== undefined) {
            setShowConcealer(data.showConcealer);
          }

          if (data.concealerColor !== undefined) {
            setConcealerColor(data.concealerColor);
          }

          // contour
          if (data.showContour !== undefined) {
            setShowContour(data.showContour);
          }

          if (data.contourColors !== undefined) {
            setContourColors(data.contourColors);
          }

          if (data.contourMode !== undefined) {
            setContourMode(data.contourMode);
          }

          if (data.contourPattern !== undefined) {
            setContourShape(data.contourShape);
          }

          // blush
          if (data.showBlush !== undefined) {
            setShowBlush(data.showBlush);
          }

          if (data.blushColor !== undefined) {
            setBlushColor(data.blushColor);
          }

          if (data.blushMode !== undefined) {
            setBlushMode(data.blushMode);
          }

          if (data.blushPattern !== undefined) {
            setBlushPattern(data.setBlushPattern);
          }

          // bronzer
          if (data.showBronzer !== undefined) {
            setShowBronzer(data.showBronzer);
          }

          if (data.bronzerColor !== undefined) {
            setBronzerColor(data.bronzerColor);
          }

          // highlighter
          if (data.showHighlighter !== undefined) {
            setShowHighlighter(data.showHighlighter);
          }

          if (data.highlighterColor !== undefined) {
            setHighlighterColor(data.highlighterColor);
          }

          if (data.highlighterPattern !== undefined) {
            setHighlighterPattern(data.highlighterPattern);
          }

          //eyeshadow
          if (data.showEyeShadow !== undefined) {
            setShowEyeShadow(data.showEyeShadow);
          }

          if (data.eyeShadowColor !== undefined) {
            setEyeShadowColor(data.eyeShadowColor);
          }

          if (data.eyeshadowPattern !== undefined) {
            setEyeShadowPattern(data.eyeshadowPattern);
          }

          if (data.eyeshadowMaterial !== undefined) {
            setEyeShadowMaterial(data.eyeshadowMaterial);
          }

          //bracelet
          if (data.showBracelet !== undefined) {
            setShowBracelet(data.showBracelet);
          }

          //glasess
          if (data.showGlasess !== undefined) {
            setShowGlasess(data.showGlasess);
          }

          //earring
          if (data.showEarring !== undefined) {
            setShowEarring(data.showEarring);
          }

          //hat
          if (data.showHat !== undefined) {
            setShowHat(data.showHat);
          }

          //headband
          if (data.showHeadband !== undefined) {
            setShowHeadband(data.showHeadband);
          }

          // necklace
          if (data.showNecklace !== undefined) {
            setShowNecklace(data.showNecklace);
          }

          // ring
          if (data.showRing !== undefined) {
            setShowRing(data.showRing);
          }

          // watch
          if (data.showWatch !== undefined) {
            setShowWatch(data.showWatch);
          }

          // nails
          if (data.showNails !== undefined) {
            setShowNails(data.showNails);
          }

          if (data.nailsColor !== undefined) {
            setNailsColor(data.nailsColor);
          }

          if (data.nailsTexture !== undefined) {
            setNailsTexture(data.nailsTexture);
          }

          // hair
          if (data.showHair !== undefined) {
            setShowHair(data.showHair);
          }

          if (data.hairColor !== undefined) {
            setHairColor(data.hairColor);
          }

          //before after
          if (data.beforeAfter !== undefined) {
            compareCapture();
          }

          //flip camera
          if (data.flipCamera !== undefined) {
            flipCamera();
          }

          // screenshoot
          if (data.screenShoot !== undefined) {
            screenShoot();
          }

          // media
          if (data.mode !== undefined) {
            setMode(data.mode);
          }

          // set media file
          if (data.media !== undefined) {
            setMediaFile(data.media);
          }

          //handle add media
        } catch (error) {
          console.error("Error parsing message:", error); // Menampilkan error jika parsing gagal
        }
      } else {
        console.warn("No data received in message event");
      }
    };

    // Menambahkan event listener untuk menerima pesan
    window.addEventListener("message", handleMessage);

    // Membersihkan event listener saat komponen unmount
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <div className="relative mx-auto h-full min-h-dvh w-full bg-black">
      <div className="absolute inset-0">
        <VirtualTryOnScene mediaFile={mediaFile} mode={mode} />
        <div className="pointer-events-none absolute inset-0"></div>
      </div>
    </div>
  );
}
