import React, { createContext, useState, useContext } from "react";

interface LipPlumperContextType {
  colorFamily: string | null;
  setColorFamily: (color: string | null) => void;
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
  colorFamilyToInclude: string[] | null;
  setColorFamilyToInclude: (family: string[] | null) => void;
  selectedTexture: string | null;
  setSelectedTexture: (texture: string | null) => void;
}

// Create the context
const LipPlumperContext = createContext<LipPlumperContextType | undefined>(
  undefined,
);

// Create a provider component
export function LipPlumperProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [colorFamily, setColorFamily] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [colorFamilyToInclude, setColorFamilyToInclude] = useState<string[] | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedTexture, setSelectedTexture] = useState<string | null>(null);

  return (
    <LipPlumperContext.Provider
      value={{
        colorFamily,
        setColorFamily,
        selectedColor,
        setSelectedColor,
        colorFamilyToInclude,
        setColorFamilyToInclude,
        selectedTexture,
        setSelectedTexture,
      }}
    >
      {children}
    </LipPlumperContext.Provider>
  );
}

// Custom hook to use the context
export function useLipPlumperContext() {
  const context = useContext(LipPlumperContext);
  if (context === undefined) {
    throw new Error(
      "useLipPlumperContext must be used within a LipPlumperProvider"
    );
  }
  return context;
}
