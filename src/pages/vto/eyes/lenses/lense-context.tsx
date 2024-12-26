import React, { createContext, useState, useContext } from "react";

interface LenseContextType {
  colorFamily: string | null;
  setColorFamily: (color: string | null) => void;
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
  colorFamilyToInclude: string[] | null;
  setColorFamilyToInclude: (family: string[] | null) => void;
}

// Create the context
const LenseContext = createContext<LenseContextType | undefined>(undefined);

// Create a provider component
export function LenseProvider({ children }: { children: React.ReactNode }) {
  const [colorFamily, setColorFamily] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [colorFamilyToInclude, setColorFamilyToInclude] = useState<string[] | null>(null);

  return (
    <LenseContext.Provider
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
    </LenseContext.Provider>
  );
}

// Custom hook to use the context
export function useLenseContext() {
  const context = useContext(LenseContext);
  if (context === undefined) {
    throw new Error("useLenseContext must be used within a LenseProvider");
  }
  return context;
}
