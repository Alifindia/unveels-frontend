import React, { createContext, useState, useContext } from "react";

interface MascaraContextType {
  colorFamily: string | null;
  setColorFamily: (color: string | null) => void;
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
  colorFamilyToInclude: string[] | null;
  setColorFamilyToInclude: (family: string[] | null) => void;
}

// Create the context
const MascaraContext = createContext<MascaraContextType | undefined>(undefined);

// Create a provider component
export function MascaraProvider({ children }: { children: React.ReactNode }) {
  const [colorFamily, setColorFamily] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [colorFamilyToInclude, setColorFamilyToInclude] = useState<string[] | null>(null);

  return (
    <MascaraContext.Provider
      value={{
        colorFamily,
        setColorFamily,
        selectedColor,
        setSelectedColor,
        colorFamilyToInclude,
        setColorFamilyToInclude,
      }}
    >
      {children}
    </MascaraContext.Provider>
  );
}

// Custom hook to use the context
export function useMascaraContext() {
  const context = useContext(MascaraContext);
  if (context === undefined) {
    throw new Error("useMascaraContext must be used within a MascaraProvider");
  }
  return context;
}
