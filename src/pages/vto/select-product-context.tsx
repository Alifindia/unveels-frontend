import React, { createContext, useState, useContext } from "react";

interface SelecProductNumberContextType {
  selectedProductNumber: number | null;
  setSelectedProductNumber: (productNumber: number | null) => void;
  addCartProductNumber: number | null;
  setAddCartProductNumber: (productNumber: number | null) => void;
}

// Create the context
const SelecProductNumberContext = createContext<SelecProductNumberContextType | undefined>(
  undefined,
);

// Create a provider component
export function SelecProductNumberProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedProductNumber, setSelectedProductNumberState] = useState<number | null>(null);
  const [addCartProductNumber, setAddCartProductNumberState] = useState<number | null>(null);

  // Custom setter to avoid redundant updates
  const setSelectedProductNumber = (productNumber: number | null) => {
    if (productNumber !== selectedProductNumber) {
      setSelectedProductNumberState(productNumber);
    }
  };

  const setAddCartProductNumber = (productNumber: number | null) => {
    if (productNumber !== addCartProductNumber) {
      setAddCartProductNumberState(productNumber);
    }
  };

  return (
    <SelecProductNumberContext.Provider
      value={{
        selectedProductNumber,
        setSelectedProductNumber,
        addCartProductNumber,
        setAddCartProductNumber
      }}
    >
      {children}
    </SelecProductNumberContext.Provider>
  );
}

// Custom hook to use the context
export function useSelecProductNumberContext() {
  const context = useContext(SelecProductNumberContext);
  if (context === undefined) {
    throw new Error(
      "useSelecProductNumberContext must be used within a SelecProductNumberProvider"
    );
  }
  return context;
}
