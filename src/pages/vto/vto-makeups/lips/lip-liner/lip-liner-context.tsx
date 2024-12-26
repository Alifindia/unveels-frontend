import React, { createContext, useState, useContext } from "react";

interface LipLinerContextType {
  colorFamily: string | null;
  setColorFamily: (color: string | null) => void;
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
  selectedSize: string;
  setSelectedSize: (shade: string) => void;
}

// Create the context
const LipLinerContext = createContext<LipLinerContextType | undefined>(
  undefined,
);

// Create a provider component
export function LipLinerProvider({ children }: { children: React.ReactNode }) {
  const [colorFamily, setColorFamily] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("0");

  return (
    <LipLinerContext.Provider
      value={{
        colorFamily,
        setColorFamily,
        selectedColor,
        setSelectedColor,
        selectedSize,
        setSelectedSize,
      }}
    >
      {children}
    </LipLinerContext.Provider>
  );
}

// Custom hook to use the context
export function useLipLinerContext() {
  const context = useContext(LipLinerContext);
  if (context === undefined) {
    throw new Error(
      "useLipLinerContext must be used within a LipLinerProvider",
    );
  }
  return context;
}
