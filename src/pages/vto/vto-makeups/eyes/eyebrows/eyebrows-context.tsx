import React, { createContext, useState, useContext } from "react";

interface EyebrowsContextType {
  colorFamily: string | null;
  setColorFamily: (color: string | null) => void;
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
  selectedPattern: string | null;
  setSelectedPattern: (shade: string | null) => void;
  brightness: number;
  setBrightness: (brightness: number) => void;
}

// Create the context
const EyebrowsContext = createContext<EyebrowsContextType | undefined>(
  undefined,
);

// Create a provider component
export function EyebrowsProvider({ children }: { children: React.ReactNode }) {
  const [colorFamily, setColorFamily] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [brightness, setBrightness] = useState<number>(100);

  return (
    <EyebrowsContext.Provider
      value={{
        colorFamily,
        setColorFamily,
        selectedColor,
        setSelectedColor,
        selectedPattern,
        setSelectedPattern,
        brightness,
        setBrightness,
      }}
    >
      {children}
    </EyebrowsContext.Provider>
  );
}

// Custom hook to use the context
export function useEyebrowsContext() {
  const context = useContext(EyebrowsContext);
  if (context === undefined) {
    throw new Error(
      "useEyebrowsContext must be used within a EyebrowsProvider",
    );
  }
  return context;
}
