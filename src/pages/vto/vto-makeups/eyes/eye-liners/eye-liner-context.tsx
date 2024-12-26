import React, { createContext, useState, useContext } from "react";

interface EyeLinerContextType {
  colorFamily: string | null;
  setColorFamily: (color: string | null) => void;
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
  selectedShape: string | null;
  setSelectedShape: (shape: string | null) => void;
}

// Create the context
const EyeLinerContext = createContext<EyeLinerContextType | undefined>(
  undefined,
);

// Create a provider component
export function EyeLinerProvider({ children }: { children: React.ReactNode }) {
  const [colorFamily, setColorFamily] = useState<string | null>(null);
  const [selectedColor, setColor] = useState<string | null>(null);
  const [selectedShape, setSelectedShape] = useState<string | null>(null);

  return (
    <EyeLinerContext.Provider
      value={{
        colorFamily,
        setColorFamily,
        selectedColor,
        setSelectedColor: setColor,
        selectedShape,
        setSelectedShape,
      }}
    >
      {children}
    </EyeLinerContext.Provider>
  );
}

// Custom hook to use the context
export function useEyeLinerContext() {
  const context = useContext(EyeLinerContext);
  if (context === undefined) {
    throw new Error(
      "useEyeLinerContext must be used within a EyeLinerProvider",
    );
  }
  return context;
}
