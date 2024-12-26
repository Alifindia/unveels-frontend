import React, { createContext, useContext, useState } from "react";

interface WatchesContextType {
  colorFamily: string | null;
  setColorFamily: (color: string | null) => void;
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
  selectedMode: string | null;
  setSelectedMode: (color: string | null) => void;
  selectedMaterial: string | null;
  setSelectedMaterial: (material: string | null) => void;
  selectedShape: string | null;
  setSelectedShape: (shape: string | null) => void;
}

// Create the context
const WatchesContext = createContext<WatchesContextType | undefined>(undefined);

// Create a provider component
export function WatchesProvider({ children }: { children: React.ReactNode }) {
  const [colorFamily, setColorFamily] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<string | null>("shapes");
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [selectedShape, setSelectedShape] = useState<string | null>(null);

  return (
    <WatchesContext.Provider
      value={{
        colorFamily,
        setColorFamily,
        selectedColor,
        setSelectedColor,
        selectedMode,
        setSelectedMode,
        selectedMaterial,
        setSelectedMaterial,
        selectedShape,
        setSelectedShape,
      }}
    >
      {children}
    </WatchesContext.Provider>
  );
}

// Custom hook to use the context
export function useWatchesContext() {
  const context = useContext(WatchesContext);
  if (context === undefined) {
    throw new Error("useWatchesContext must be used within a WatchesProvider");
  }
  return context;
}
