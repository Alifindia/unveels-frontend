import React, { createContext, useContext, useState } from "react";

interface HeadbandContextType {
  colorFamily: string | null;
  setColorFamily: (color: string | null) => void;
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
  selectedFabric: string | null;
  setSelectedFabric: (shape: string | null) => void;
}

// Create the context
const HeadbandContext = createContext<HeadbandContextType | undefined>(
  undefined,
);

// Create a provider component
export function HeadbandProvider({ children }: { children: React.ReactNode }) {
  const [colorFamily, setColorFamily] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedFabric, setSelectedFabric] = useState<string | null>(null);

  return (
    <HeadbandContext.Provider
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
    </HeadbandContext.Provider>
  );
}

// Custom hook to use the context
export function useHeadbandContext() {
  const context = useContext(HeadbandContext);
  if (context === undefined) {
    throw new Error(
      "useHeadbandContext must be used within a HeadbandProvider",
    );
  }
  return context;
}
