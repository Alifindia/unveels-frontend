import React, { createContext, useContext, useState } from "react";

interface HandwearContextType {
  colorFamily: string | null;
  setColorFamily: (color: string | null) => void;
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
  selectedMaterial: string | null;
  setSelectedMaterial: (material: string | null) => void;
}

// Create the context
const HandwearContext = createContext<HandwearContextType | undefined>(undefined);

// Create a provider component
export function HandwearProvider({ children }: { children: React.ReactNode }) {
  const [colorFamily, setColorFamily] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);

  return (
    <HandwearContext.Provider
      value={{
        colorFamily,
        setColorFamily,
        selectedColor,
        setSelectedColor,
        selectedMaterial,
        setSelectedMaterial,
      }}
    >
      {children}
    </HandwearContext.Provider>
  );
}

// Custom hook to use the context
export function useHandwearContext() {
  const context = useContext(HandwearContext);
  if (context === undefined) {
    throw new Error("useHandwearContext must be used within a HandwearProvider");
  }
  return context;
}
