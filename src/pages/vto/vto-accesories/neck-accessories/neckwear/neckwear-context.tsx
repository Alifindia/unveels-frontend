import React, { createContext, useContext, useState } from "react";

interface NeckwearContextType {
  colorFamily: string | null;
  setColorFamily: (color: string | null) => void;
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
}

// Create the context
const NeckwearContext = createContext<NeckwearContextType | undefined>(undefined);

// Create a provider component
export function NeckwearProvider({ children }: { children: React.ReactNode }) {
  const [colorFamily, setColorFamily] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  return (
    <NeckwearContext.Provider
      value={{
        colorFamily,
        setColorFamily,
        selectedColor,
        setSelectedColor,
      }}
    >
      {children}
    </NeckwearContext.Provider>
  );
}

// Custom hook to use the context
export function useNeckwearContext() {
  const context = useContext(NeckwearContext);
  if (context === undefined) {
    throw new Error("useNeckwearContext must be used within a NeckwearProvider");
  }
  return context;
}
