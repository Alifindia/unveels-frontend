import React, { createContext, useContext, useState } from "react";

interface HatsContextType {
  colorFamily: string | null;
  setColorFamily: (color: string | null) => void;
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
  selectedMode: string | null;
  setSelectedMode: (color: string | null) => void;
  selectedOccasion: string | null;
  setSelectedOccasion: (shape: string | null) => void;
  selectedFabric: string | null;
  setSelectedFabric: (shape: string | null) => void;
}

// Create the context
const HatsContext = createContext<HatsContextType | undefined>(undefined);

// Create a provider component
export function HatsProvider({ children }: { children: React.ReactNode }) {
  const [colorFamily, setColorFamily] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<string | null>("occasions");
  const [selectedFabric, setSelectedFabric] = useState<string | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);

  return (
    <HatsContext.Provider
      value={{
        colorFamily,
        setColorFamily,
        selectedColor,
        setSelectedColor,
        selectedMode,
        setSelectedMode,
        selectedFabric,
        setSelectedFabric,
        selectedOccasion,
        setSelectedOccasion,
      }}
    >
      {children}
    </HatsContext.Provider>
  );
}

// Custom hook to use the context
export function useHatsContext() {
  const context = useContext(HatsContext);
  if (context === undefined) {
    throw new Error("useHatsContext must be used within a HatsProvider");
  }
  return context;
}
