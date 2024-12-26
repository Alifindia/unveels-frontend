import React, { createContext, useState, useContext, useEffect } from "react";

interface ContourContextType {
  selectedColors: string[];
  setSelectedColors: (colors: string[]) => void;
  selectedShape: string;
  setSelectedShape: (shape: string) => void;
  selectedMode: string;
  setSelectedMode: (mode: string) => void;
  replaceIndex: number;
  setReplaceIndex: (index: number) => void;
  selectedTexture: string | null;
  setSelectedTexture: (texture: string | null) => void;
}

// Create the context
const ContourContext = createContext<ContourContextType | undefined>(undefined);

// Create a provider component
export function ContourProvider({ children }: { children: React.ReactNode }) {
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedShape, setSelectedShape] = useState<string>("0");
  const [selectedMode, setSelectedMode] = useState<string>("One");
  const [replaceIndex, setReplaceIndex] = useState<number>(0);
  const [selectedTexture, setSelectedTexture] = useState<string | null>(null);

  // Ensure that when mode changes to "One", only one color is selected
  useEffect(() => {
    if (selectedMode === "One" && selectedColors.length > 1) {
      setSelectedColors([selectedColors[0]]);
      setReplaceIndex(0); // Reset replaceIndex when mode changes
    }
  }, [selectedMode, selectedColors]);

  // Ensure that when mode changes to "Dual" and less than two colors are selected, reset replaceIndex
  useEffect(() => {
    if (selectedMode === "Dual" && selectedColors.length < 2) {
      setReplaceIndex(selectedColors.length % 2); // Set replaceIndex based on current selection
    }
  }, [selectedMode, selectedColors]);

  return (
    <ContourContext.Provider
      value={{
        selectedColors,
        setSelectedColors,
        selectedShape,
        setSelectedShape,
        selectedMode,
        setSelectedMode,
        replaceIndex,
        setReplaceIndex,
        selectedTexture,
        setSelectedTexture,
      }}
    >
      {children}
    </ContourContext.Provider>
  );
}

// Custom hook to use the context
export function useContourContext() {
  const context = useContext(ContourContext);
  if (context === undefined) {
    throw new Error("useContourContext must be used within a ContourProvider");
  }
  return context;
}
