import React, { createContext, useContext, useState } from "react";
import { FacialFeatureType } from "../components/skin-improvement/skin-improvement-three-scene";

interface SkinImprovementContextValue {
  sigmaSpatial: number;
  setSigmaSpatial: (value: number) => void;
  sigmaColor: number;
  setSigmaColor: (value: number) => void;
  smoothingStrength: number;
  setSmoothingStrength: (value: number) => void;
  featureType: FacialFeatureType;
  setFeatureType: (value: FacialFeatureType) => void;
}

const SkinImprovementContext = createContext<
  SkinImprovementContextValue | undefined
>(undefined);

export const SkinImprovementProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [sigmaSpatial, setSigmaSpatial] = useState(500.0);
  const [sigmaColor, setSigmaColor] = useState(0.08);
  const [smoothingStrength, setSmoothingStrength] = useState(0.5);
  const [featureType, setFeatureType] = useState<FacialFeatureType>("acne");

  return (
    <SkinImprovementContext.Provider
      value={{
        sigmaSpatial,
        setSigmaSpatial,
        sigmaColor,
        setSigmaColor,
        smoothingStrength,
        setSmoothingStrength,
        featureType,
        setFeatureType
      }}
    >
      {children}
    </SkinImprovementContext.Provider>
  );
};

// Custom hook for accessing context
export const useSkinImprovement = () => {
  const context = useContext(SkinImprovementContext);
  if (!context) {
    throw new Error(
      "useSkinImprovement must be used within a SkinImprovementProvider",
    );
  }
  return context;
};
