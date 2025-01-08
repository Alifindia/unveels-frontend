import React, { createContext, useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

type VirtualTryOnProductContextType = {
  skus: string[];
  clearSkus: () => void;
};

type VirtualTryOnProductProviderProps = {
  children: React.ReactNode;
  initialSkus?: string[];
};

const VirtualTryOnProductContext = createContext<VirtualTryOnProductContextType | undefined>(undefined);

const getSkusFromURL = (): string[] => {
  const urlParams = new URLSearchParams(window.location.search);
  const sku = urlParams.get("sku");
  console.log(sku);
  return sku ? sku.split(",").filter(Boolean) : [];
};

export function VirtualTryOnProductProvider({
  children,
  initialSkus = [],
}: VirtualTryOnProductProviderProps) {
  const [searchParams] = useSearchParams();

  const [skus, setSkus] = useState<string[]>(() => {
    const skusFromURL = getSkusFromURL();
    if (skusFromURL.length > 0) {
      return skusFromURL;
    }

    const skusFromParams = searchParams.get("sku")?.split(",").filter(Boolean) || [];
    if (skusFromParams.length > 0) {
      return skusFromParams;
    }
    return initialSkus;
  });

  const clearSkus = () => setSkus([]);

  useEffect(() => {
    const skusFromURL = getSkusFromURL();
    if (skusFromURL.length > 0) {
      setSkus(skusFromURL);
      return;
    }

    const skusFromParams = searchParams.get("sku")?.split(",").filter(Boolean) || [];
    if (skusFromParams.length > 0) {
      setSkus(skusFromParams);
    }
  }, [searchParams]);

  return (
    <VirtualTryOnProductContext.Provider
      value={{
        skus,
        clearSkus,
      }}
    >
      {children}
    </VirtualTryOnProductContext.Provider>
  );
}

export function useVirtualTryOnProduct() {
  const context = useContext(VirtualTryOnProductContext);
  if (!context) {
    throw new Error(
      "useVirtualTryOnProduct must be used within VirtualTryOnProductProvider"
    );
  }
  return context;
}