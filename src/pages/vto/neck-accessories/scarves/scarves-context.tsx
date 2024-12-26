import React, { createContext, useContext, useState } from "react";

interface ScarvesContextType {
  colorFamily: string | null;
  setColorFamily: (color: string | null) => void;
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
  selectedFabric: string | null;
  setSelectedFabric: (material: string | null) => void;
}

// Create the context
const ScarvesContext = createContext<ScarvesContextType | undefined>(undefined);

// Create a provider component
export function ScarvesProvider({ children }: { children: React.ReactNode }) {
  const [colorFamily, setColorFamily] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedFabric, setSelectedFabric] = useState<string | null>(null);

  return (
    <ScarvesContext.Provider
      value={{
        colorFamily,
        setColorFamily,
        selectedColor,
        setSelectedColor,
        selectedFabric,
        setSelectedFabric,
      }}
    >
      {children}
    </ScarvesContext.Provider>
  );
}

// Custom hook to use the context
export function useScarvesContext() {
  const context = useContext(ScarvesContext);
  if (context === undefined) {
    throw new Error("useScarvesContext must be used within a ScarvesProvider");
  }
  return context;
}
