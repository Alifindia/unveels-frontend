import React, { createContext, useState, useContext } from "react";

interface NailPolishContextType {
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
const NailPolishContext = createContext<NailPolishContextType | undefined>(
  undefined,
);

// Create a provider component
export function NailPolishProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [colorFamily, setColorFamily] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [colorFamilyToInclude, setColorFamilyToInclude] = useState<string[] | null>(null);
  const [selectedTexture, setSelectedTexture] = useState<string | null>(null);

  return (
    <NailPolishContext.Provider
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
    </NailPolishContext.Provider>
  );
}

// Custom hook to use the context
export function useNailPolishContext() {
  const context = useContext(NailPolishContext);
  if (context === undefined) {
    throw new Error(
      "useNailPolishContext must be used within a NailPolishProvider",
    );
  }
  return context;
}
