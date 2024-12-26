import React, { createContext, useState, useContext } from "react";

interface PressOnNailsContextType {
  colorFamily: string | null;
  setColorFamily: (color: string | null) => void;
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
  selectedShape: string | null;
  setSelectedShape: (shape: string | null) => void;
}

// Create the context
const PressOnNailsContext = createContext<PressOnNailsContextType | undefined>(
  undefined,
);

// Create a provider component
export function PressOnNailsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [colorFamily, setColorFamily] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedTexture, setSelectedTexture] = useState<string | null>(null);
  const [selectedShape, setSelectedShape] = useState<string | null>(null);

  return (
    <PressOnNailsContext.Provider
      value={{
        colorFamily,
        setColorFamily,
        selectedColor,
        setSelectedColor,
        selectedShape,
        setSelectedShape,
      }}
    >
      {children}
    </PressOnNailsContext.Provider>
  );
}

// Custom hook to use the context
export function usePressOnNailsContext() {
  const context = useContext(PressOnNailsContext);
  if (context === undefined) {
    throw new Error(
      "usePressOnNailsContext must be used within a PressOnNailsProvider",
    );
  }
  return context;
}
