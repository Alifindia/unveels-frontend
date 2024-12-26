import React, { createContext, useContext, useState } from "react";

interface HairColorContextType {
  colorFamily: string | null;
  setColorFamily: (color: string | null) => void;
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
}

// Create the context
const HairColorContext = createContext<HairColorContextType | undefined>(
  undefined,
);

// Create a provider component
export function HairColorProvider({ children }: { children: React.ReactNode }) {
  const [colorFamily, setColorFamily] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  return (
    <HairColorContext.Provider
      value={{
        colorFamily,
        setColorFamily,
        selectedColor,
        setSelectedColor,
      }}
    >
      {children}
    </HairColorContext.Provider>
  );
}

// Custom hook to use the context
export function useHairColorContext() {
  const context = useContext(HairColorContext);
  if (context === undefined) {
    throw new Error(
      "useHairColorContext must be used within a HairColorProvider",
    );
  }
  return context;
}
