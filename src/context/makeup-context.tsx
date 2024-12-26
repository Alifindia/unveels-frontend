// MakeupContext.tsx
import React, { createContext, ReactNode, useContext, useState } from "react";
import { Texture } from "three";

interface MakeupContextProps {
  //foundation
  foundationColor: string;
  setFoundationColor: (color: string) => void;

  showFoundation: boolean;
  setShowFoundation: (show: boolean) => void;

  //blush
  blushColor: string[];
  setBlushColor: (color: string[]) => void;

  blushPattern: number;
  setBlushPattern: (pattern: number) => void;

  blushMaterial: number;
  setBlushMaterial: (material: number) => void;

  showBlush: boolean;
  setShowBlush: (show: boolean) => void;

  blushMode: "One" | "Dual" | "Tri";
  setBlushMode: (mode: "One" | "Dual" | "Tri") => void;

  //Eyeshadow
  eyeshadowColor: string[];
  setEyeShadowColor: (color: string[]) => void;

  eyeshadowPattern: number;
  setEyeShadowPattern: (pattern: number) => void;

  eyeshadowMaterial: number;
  setEyeShadowMaterial: (material: number) => void;

  showEyeShadow: boolean;
  setShowEyeShadow: (show: boolean) => void;

  eyeshadowMode: "One" | "Dual" | "Tri" | "Quad" | "Penta";
  setEyeShadowMode: (mode: "One" | "Dual" | "Tri" | "Quad" | "Penta") => void;

  //Eyeliner
  showEyeliner: boolean;
  setShowEyeliner: (show: boolean) => void;

  eyelinerColor: string;
  setEyelinerColor: (color: string) => void;

  eyelinerPattern: number;
  setEyelinerPattern: (pattern: number) => void;

  //Lashes
  showLashes: boolean;
  setShowLashes: (show: boolean) => void;

  lashesColor: string;
  setLashesColor: (color: string) => void;

  lashesPattern: number;
  setLashesPattern: (pattern: number) => void;

  // mascara
  showMascara: boolean;
  setShowMascara: (show: boolean) => void;

  mascaraColor: string;
  setMascaraColor: (color: string) => void;

  //Concealer
  showConcealer: boolean;
  setShowConcealer: (show: boolean) => void;

  concealerColor: string;
  setConcealerColor: (color: string) => void;

  showHighlighter: boolean;
  setShowHighlighter: (show: boolean) => void;

  highlighterPattern: number;
  setHighlighterPattern: (pattern: number) => void;

  highlighterColor: string;
  setHighlighterColor: (color: string) => void;

  highlighterMaterial: number;
  setHighlighterMaterial: (material: number) => void;

  showContour: boolean;
  setShowContour: (show: boolean) => void;

  contourMode: "One" | "Dual";
  setContourMode: (mode: "One" | "Dual") => void;

  contourColors: string[];
  setContourColors: (colors: string[]) => void;

  contourShape: string;
  setContourShape: (shape: string) => void;

  showLipliner: boolean;
  setShowLipliner: (show: boolean) => void;

  liplinerColor: string;
  setLiplinerColor: (color: string) => void;

  liplinerPattern: number;
  setLiplinerPattern: (pattern: number) => void;

  showLipplumper: boolean;
  setShowLipplumper: (show: boolean) => void;

  lipplumperColor: string;
  setLipplumperColor: (color: string) => void;

  showLipColor: boolean;
  setShowLipColor: (show: boolean) => void;

  lipColorMode: "One" | "Dual" | "Ombre";
  setLipColorMode: (mode: "One" | "Dual" | "Ombre") => void;

  lipColors: string[];
  setLipColors: (colors: string[]) => void;

  lipTexture:
    | "Matte"
    | "Gloss"
    | "Satin"
    | "Sheer"
    | "Shimmer"
    | "Metalic"
    | "Holographic";
  setLipTexture: (
    mode:
      | "Matte"
      | "Gloss"
      | "Satin"
      | "Sheer"
      | "Shimmer"
      | "Metalic"
      | "Holographic",
  ) => void;

  showBronzer: boolean;
  setShowBronzer: (show: boolean) => void;

  bronzerColor: string;
  setBronzerColor: (color: string) => void;

  bronzerPattern: number;
  setBronzerPattern: (shape: number) => void;

  showLens: boolean;
  setShowLens: (show: boolean) => void;

  lensPattern: number;
  setLensPattern: (number: number) => void;

  showEyebrows: boolean;
  setShowEyebrows: (show: boolean) => void;

  eyebrowsPattern: number;
  setEyebrowsPattern: (pattern: number) => void;

  eyebrowsVisibility: number;
  setEyebrowsVisibility: (visibility: number) => void;

  eyebrowsColor: string;
  setEyebrowsColor: (color: string) => void;

  showHair: boolean;
  setShowHair: (show: boolean) => void;

  hairColor: string;
  setHairColor: (color: string) => void;

  envMapMakeup: Texture | null;
  setEnvMapMakeup: (texture: Texture | null) => void;
}

const MakeupContext = createContext<MakeupContextProps | undefined>(undefined);

type MakeupSelectables =
  // Foundation
  | "foundationColor"
  | "showFoundation"
  // Eyeliner
  | "eyelinerPattern"
  | "eyelinerColor"
  | "showEyeliner"
  // Mascara
  | "mascaraColor"
  | "showMascara"
  // Lashes
  | "showLashes"
  | "lashesColor"
  | "lashesPattern"
  // Blush
  | "blushColor"
  | "blushPattern"
  | "blushMaterial"
  | "blushMode"
  // Eyeshadow
  | "eyeshadowColor"
  | "eyeshadowPattern"
  | "eyeshadowMaterial"
  | "showEyeShadow"
  | "eyeshadowMode"
  // Concealer
  | "showBlush"
  | "showConcealer"
  | "concealerColor"
  // Highlighter
  | "showHighlighter"
  | "highlighterPattern"
  | "highlighterColor"
  | "highlighterMaterial"
  // Contour
  | "showContour"
  | "contourMode"
  | "contourColors"
  | "contourShape"
  // Lipliner
  | "showLipliner"
  | "liplinerColor"
  | "liplinerPattern"
  // Lipplumper
  | "showLipplumper"
  | "lipplumperColor"
  // Lip Color
  | "showLipColor"
  | "lipColorMode"
  | "lipColors"
  | "lipTexture"
  // Hair
  | "showHair"
  | "hairColor";

interface MakeupProviderProps {
  initialValues?: Partial<Pick<MakeupContextProps, MakeupSelectables>>;
  children: ReactNode;
}

export const MakeupProvider: React.FC<MakeupProviderProps> = ({
  children,
  initialValues,
}) => {
  const [foundationColor, setFoundationColor] = useState(
    initialValues?.foundationColor ?? "",
  );
  const [showFoundation, setShowFoundation] = useState(
    initialValues?.showFoundation ?? false,
  );
  //Blush
  const [blushColor, setBlushColor] = useState(initialValues?.blushColor ?? []);
  const [showBlush, setShowBlush] = useState(initialValues?.showBlush ?? false);
  const [blushPattern, setBlushPattern] = useState(
    initialValues?.blushPattern ?? 0,
  );
  const [blushMaterial, setBlushMaterial] = useState(
    initialValues?.blushMaterial ?? 0,
  );

  const [blushMode, setBlushMode] = useState<"One" | "Dual" | "Tri">(
    (initialValues?.blushMode as "One" | "Dual" | "Tri") ?? "One",
  );
  //Eyeshadow
  const [eyeshadowColor, setEyeShadowColor] = useState(
    initialValues?.eyeshadowColor ?? [],
  );
  const [showEyeShadow, setShowEyeShadow] = useState(
    initialValues?.showEyeShadow ?? false,
  );
  const [eyeshadowPattern, setEyeShadowPattern] = useState(
    initialValues?.eyeshadowPattern ?? 0,
  );
  const [eyeshadowMaterial, setEyeShadowMaterial] = useState(
    initialValues?.eyeshadowMaterial ?? 0,
  );

  const [eyeshadowMode, setEyeShadowMode] = useState<
    "One" | "Dual" | "Tri" | "Quad" | "Penta"
  >(
    (initialValues?.eyeshadowMode as
      | "One"
      | "Dual"
      | "Tri"
      | "Quad"
      | "Penta") ?? "One",
  );

  // Eyeliner
  const [showEyeliner, setShowEyeliner] = useState(
    initialValues?.showEyeliner ?? false,
  );

  const [eyelinerColor, setEyelinerColor] = useState(
    initialValues?.eyelinerColor ?? "#0f0f0f",
  );

  const [eyelinerPattern, setEyelinerPattern] = useState(
    initialValues?.eyelinerPattern ?? 0,
  );

  // Lashes
  const [showLashes, setShowLashes] = useState(
    initialValues?.showLashes ?? false,
  );

  const [lashesColor, setLashesColor] = useState(
    initialValues?.lashesColor ?? "#FFFF",
  );

  const [lashesPattern, setLashesPattern] = useState(
    initialValues?.lashesPattern ?? 0,
  );

  // Mascara
  const [showMascara, setShowMascara] = useState(
    initialValues?.showMascara ?? false,
  );

  const [mascaraColor, setMascaraColor] = useState(
    initialValues?.mascaraColor ?? "#FFFF",
  );

  //Concealer
  const [showConcealer, setShowConcealer] = useState(
    initialValues?.showConcealer ?? false,
  );
  const [concealerColor, setConcealerColor] = useState(
    initialValues?.concealerColor ?? "#FFFF",
  );

  const [showHighlighter, setShowHighlighter] = useState(
    initialValues?.showHighlighter ?? false,
  );
  const [highlighterPattern, setHighlighterPattern] = useState(
    initialValues?.highlighterPattern ?? 0,
  );
  const [highlighterColor, setHighlighterColor] = useState(
    initialValues?.highlighterColor ?? "#FFFF",
  );
  const [highlighterMaterial, setHighlighterMaterial] = useState(
    initialValues?.highlighterMaterial ?? 0,
  );
  // Countoer
  const [showContour, setShowContour] = useState(
    initialValues?.showContour ?? false,
  );
  const [contourMode, setContourMode] = useState<"One" | "Dual">(
    initialValues?.contourMode ?? "One",
  );
  const [contourColors, setContourColors] = useState<string[]>(
    initialValues?.contourColors ?? [],
  );
  const [contourShape, setContourShape] = useState<string>(
    initialValues?.contourShape ?? "0",
  );

  const [showLipliner, setShowLipliner] = useState(
    initialValues?.showLipliner ?? false,
  );
  const [liplinerColor, setLiplinerColor] = useState(
    initialValues?.liplinerColor ?? "#FFFF",
  );
  const [liplinerPattern, setLiplinerPattern] = useState(
    initialValues?.liplinerPattern ?? 0,
  );

  const [showLipplumper, setShowLipplumper] = useState(
    initialValues?.showLipplumper ?? false,
  );
  const [lipplumperColor, setLipplumperColor] = useState(
    initialValues?.lipplumperColor ?? "#FFFF",
  );

  const [showLipColor, setShowLipColor] = useState(
    initialValues?.showLipColor ?? false,
  );
  const [lipColorMode, setLipColorMode] = useState<"One" | "Dual" | "Ombre">(
    initialValues?.lipColorMode ?? "One",
  );
  const [lipColors, setLipColors] = useState<string[]>(
    initialValues?.lipColors ?? [],
  );

  const [lipTexture, setLipTexture] = useState<
    | "Matte"
    | "Gloss"
    | "Satin"
    | "Sheer"
    | "Shimmer"
    | "Metalic"
    | "Holographic"
  >(initialValues?.lipTexture ?? "Matte");

  const [showHair, setShowHair] = useState(initialValues?.showHair ?? false);
  const [hairColor, setHairColor] = useState(
    initialValues?.hairColor ?? "#FFFF",
  );

  const [showBronzer, setShowBronzer] = useState(false);
  const [bronzerColor, setBronzerColor] = useState("#FFFF");
  const [bronzerPattern, setBronzerPattern] = useState(0);

  const [showLens, setShowLens] = useState(false);
  const [lensPattern, setLensPattern] = useState(0);

  const [showEyebrows, setShowEyebrows] = useState(false);
  const [eyebrowsPattern, setEyebrowsPattern] = useState(0);
  const [eyebrowsVisibility, setEyebrowsVisibility] = useState(0.6);
  const [eyebrowsColor, setEyebrowsColor] = useState("#FFFF");

  const [envMapMakeup, setEnvMapMakeup] = useState<Texture | null>(null);

  return (
    <MakeupContext.Provider
      value={{
        foundationColor,
        setFoundationColor,

        showFoundation,
        setShowFoundation,

        blushColor,
        setBlushColor,

        blushPattern,
        setBlushPattern,

        blushMaterial,
        setBlushMaterial,

        showBlush,
        setShowBlush,

        blushMode,
        setBlushMode,

        eyeshadowColor,
        setEyeShadowColor,

        eyeshadowPattern,
        setEyeShadowPattern,

        eyeshadowMaterial,
        setEyeShadowMaterial,

        showEyeShadow,
        setShowEyeShadow,

        eyeshadowMode,
        setEyeShadowMode,

        showConcealer,
        setShowConcealer,

        concealerColor,
        setConcealerColor,

        showHighlighter,
        setShowHighlighter,

        highlighterPattern,
        setHighlighterPattern,

        highlighterColor,
        setHighlighterColor,

        highlighterMaterial,
        setHighlighterMaterial,

        showContour,
        setShowContour,

        contourColors,
        setContourColors,

        contourShape,
        setContourShape,

        contourMode,
        setContourMode,

        liplinerColor,
        setLiplinerColor,

        showLipliner,
        setShowLipliner,

        liplinerPattern,
        setLiplinerPattern,

        showLipplumper,
        setShowLipplumper,

        lipplumperColor,
        setLipplumperColor,

        showLipColor,
        setShowLipColor,

        lipColorMode,
        setLipColorMode,

        lipColors,
        setLipColors,

        lipTexture,
        setLipTexture,

        showBronzer,
        setShowBronzer,

        bronzerColor,
        setBronzerColor,

        bronzerPattern,
        setBronzerPattern,

        showLens,
        setShowLens,

        lensPattern,
        setLensPattern,

        showEyebrows,
        setShowEyebrows,

        eyebrowsPattern,
        setEyebrowsPattern,

        eyebrowsVisibility,
        setEyebrowsVisibility,

        eyebrowsColor,
        setEyebrowsColor,

        showEyeliner,
        setShowEyeliner,

        eyelinerColor,
        setEyelinerColor,

        eyelinerPattern,
        setEyelinerPattern,

        showLashes,
        setShowLashes,

        lashesColor,
        setLashesColor,

        lashesPattern,
        setLashesPattern,

        showMascara,
        setShowMascara,

        mascaraColor,
        setMascaraColor,

        showHair,
        setShowHair,

        hairColor,
        setHairColor,

        envMapMakeup,
        setEnvMapMakeup,
      }}
    >
      {children}
    </MakeupContext.Provider>
  );
};

export const useMakeup = () => {
  const context = useContext(MakeupContext);
  if (!context) {
    throw new Error("useMakeup must be used within a MakeupProvider");
  }
  return context;
};
