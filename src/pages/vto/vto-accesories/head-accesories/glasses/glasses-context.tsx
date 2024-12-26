import React, { createContext, useState, useContext } from "react";

interface GlassesContextType {
  colorFamily: string | null;
  setColorFamily: (color: string | null) => void;
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
  selectedMode: string | null;
  setSelectedMode: (mode: string | null) => void;
  selectedShape: string | null;
  setSelectedShape: (shape: string | null) => void;
  selectedMaterial: string | null;
  setSelectedMaterial: (material: string | null) => void;
}

// Create the context
const GlassesContext = createContext<GlassesContextType | undefined>(undefined);

// Create a provider component
export function GlassesProvider({ children }: { children: React.ReactNode }) {
  const [colorFamily, setColorFamily] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<string | null>("shapes");
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);

  return (
    <GlassesContext.Provider
      value={{
        colorFamily,
        setColorFamily,
        selectedColor,
        setSelectedColor,
        selectedMode,
        setSelectedMode,
        selectedShape,
        setSelectedShape,
        selectedMaterial,
        setSelectedMaterial,
      }}
    >
      {children}
    </GlassesContext.Provider>
  );
}

// Custom hook to use the context
export function useGlassesContext() {
  const context = useContext(GlassesContext);
  if (context === undefined) {
    throw new Error("useGlassesContext must be used within a GlassesProvider");
  }
  return context;
}
