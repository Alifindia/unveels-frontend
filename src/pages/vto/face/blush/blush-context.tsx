import React, { createContext, useState, useContext, useEffect } from "react";

interface BlushContextType {
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
  selectedColors: string[];
  setSelectedColors: (colors: string[]) => void;
  selectedShape: string | null;
  setSelectedShape: (shape: string) => void;
  selectedTexture: string | null;
  setSelectedTexture: (mode: string | null) => void;
  selectedMode: "One" | "Dual" | "Tri";
  setSelectedMode: (mode: "One" | "Dual" | "Tri") => void;
  replaceIndex: number;
  setReplaceIndex: (index: number) => void;
}

// Create the context
const BlushContext = createContext<BlushContextType | undefined>(undefined);

// Create a provider component
export function BlushProvider({ children }: { children: React.ReactNode }) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [selectedTexture, setSelectedTexture] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<"One" | "Dual" | "Tri">(
    "One",
  );
  const [replaceIndex, setReplaceIndex] = useState<number>(0);

  // Ensure that when mode changes to "One", only one color is selected
  useEffect(() => {
    if (selectedMode === "One" && selectedColors.length > 1) {
      setSelectedColors([selectedColors[0]]);
      setReplaceIndex(0); // Reset replaceIndex when mode changes
    }
  }, [selectedMode, selectedColors]);

  // Ensure that when mode changes to "Dual" and less than two colors are selected, reset replaceIndex
  useEffect(() => {
    if (selectedMode === "Dual" && selectedColors.length > 2) {
      setSelectedColors([selectedColors[0], selectedColors[1]]);
    }
  }, [selectedMode, selectedColors]);

  return (
    <BlushContext.Provider
      value={{
        selectedColor,
        setSelectedColor,
        selectedColors,
        setSelectedColors,
        selectedShape,
        setSelectedShape,
        selectedTexture,
        setSelectedTexture,
        selectedMode,
        setSelectedMode,
        replaceIndex,
        setReplaceIndex,
      }}
    >
      {children}
    </BlushContext.Provider>
  );
}

// Custom hook to use the context
export function useBlushContext() {
  const context = useContext(BlushContext);
  if (context === undefined) {
    throw new Error("useBlushContext must be used within a BlushProvider");
  }
  return context;
}
