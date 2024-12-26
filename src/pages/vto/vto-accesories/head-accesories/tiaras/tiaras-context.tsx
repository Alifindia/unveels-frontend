import React, { createContext, useContext, useState } from "react";

interface TiaraContextType {
  colorFamily: string | null;
  setColorFamily: (color: string | null) => void;
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
  selectedMode: string | null;
  setSelectedMode: (color: string | null) => void;
  selectedOccasion: string | null;
  setSelectedOccasion: (shape: string | null) => void;
  selectedMaterial: string | null;
  setSelectedMaterial: (shape: string | null) => void;
}

// Create the context
const TiaraContext = createContext<TiaraContextType | undefined>(undefined);

// Create a provider component
export function TiaraProvider({ children }: { children: React.ReactNode }) {
  const [colorFamily, setColorFamily] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<string | null>("occasions");
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);

  return (
    <TiaraContext.Provider
      value={{
        colorFamily,
        setColorFamily,
        selectedColor,
        setSelectedColor,
        selectedMode,
        setSelectedMode,
        selectedMaterial,
        setSelectedMaterial,
        selectedOccasion,
        setSelectedOccasion,
      }}
    >
      {children}
    </TiaraContext.Provider>
  );
}

// Custom hook to use the context
export function useTiaraContext() {
  const context = useContext(TiaraContext);
  if (context === undefined) {
    throw new Error("useTiaraContext must be used within a TiaraProvider");
  }
  return context;
}
