import React, { createContext, useState, useContext } from "react";

interface BronzerContextType {
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
  selectedShape: string | null;
  setSelectedShape: (shape: string | null) => void;
  selectedTexture: string | null;
  setSelectedTexture: (mode: string | null) => void;
}

// Create the context
const BronzerContext = createContext<BronzerContextType | undefined>(undefined);

// Create a provider component
export function BronzerProvider({ children }: { children: React.ReactNode }) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [selectedTexture, setSelectedTexture] = useState<string | null>(null);

  return (
    <BronzerContext.Provider
      value={{
        selectedColor,
        setSelectedColor,
        selectedShape,
        setSelectedShape,
        selectedTexture,
        setSelectedTexture,
      }}
    >
      {children}
    </BronzerContext.Provider>
  );
}

// Custom hook to use the context
export function useBronzerContext() {
  const context = useContext(BronzerContext);
  if (context === undefined) {
    throw new Error("useBronzerContext must be used within a BronzerProvider");
  }
  return context;
}
