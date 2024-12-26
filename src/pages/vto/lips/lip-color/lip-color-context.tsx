import React, { createContext, useState, useContext, useEffect } from "react";

interface LipColorContextType {
  colorFamily: string | null;
  setColorFamily: (color: string | null) => void;
  selectedColors: string[];
  setSelectedColors: (colors: string[]) => void;
  selectedTexture: string | null;
  setSelectedTexture: (texture: string | null) => void;
  selectedShade: string | null;
  setSelectedShade: (shade: string | null) => void;
  selectedMode: string;
  setSelectedMode: (mode: string) => void;
  replaceIndex: number;
  setReplaceIndex: (index: number) => void;
  colorFamilyToInclude: string[] | null;
  setColorFamilyToInclude: (family: string[] | null) => void;
}

// Create the context
const LipColorContext = createContext<LipColorContextType | undefined>(
  undefined,
);

// Create a provider component
export function LipColorProvider({ children }: { children: React.ReactNode }) {
  const [colorFamily, setColorFamily] = useState<string | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedTexture, setSelectedTexture] = useState<string | null>(null);
  const [selectedShade, setSelectedShade] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<string>("One");
  const [replaceIndex, setReplaceIndex] = useState<number>(0);
  const [colorFamilyToInclude, setColorFamilyToInclude] = useState<string[] | null>(null);

  // Ensure that when mode changes to "One", only one color is selected
  useEffect(() => {
    if (selectedMode === "One" && selectedColors.length > 1) {
      setSelectedColors([selectedColors[0]]);
      setReplaceIndex(0); // Reset replaceIndex when mode changes
    }
  }, [selectedMode, selectedColors]);

  // Ensure that when mode changes to "Dual" and less than two colors are selected, reset replaceIndex
  useEffect(() => {
    if (
      (selectedMode === "Dual" || selectedMode === "Ombre") &&
      selectedColors.length < 2
    ) {
      setReplaceIndex(selectedColors.length % 2);
    }
  }, [selectedMode, selectedColors]);

  return (
    <LipColorContext.Provider
      value={{
        colorFamily,
        setColorFamily,
        selectedColors,
        setSelectedColors,
        selectedTexture,
        setSelectedTexture,
        selectedShade,
        setSelectedShade,
        selectedMode,
        setSelectedMode,
        replaceIndex,
        setReplaceIndex,
        colorFamilyToInclude,
        setColorFamilyToInclude
      }}
    >
      {children}
    </LipColorContext.Provider>
  );
}

// Custom hook to use the context
export function useLipColorContext() {
  const context = useContext(LipColorContext);
  if (context === undefined) {
    throw new Error(
      "useLipColorContext must be used within a LipColorProvider",
    );
  }
  return context;
}
